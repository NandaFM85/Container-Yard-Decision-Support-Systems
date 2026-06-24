import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from './db';
import { containers, yardSlots } from './db/schema'; // <-- Import variabel dari schema.ts
import { ilike, count, eq } from 'drizzle-orm';
import { SmartMethodOptimization, type Container } from './services/spk';

const app = new Elysia()
  .use(cors())
  .group('/api', (app) => app
    
    // 1. Endpoint Ambil Data Containers (Paginasi & Search)
    .get('/containers', async ({ query }) => {
      try {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const search = query.search || '';
        const offset = (page - 1) * limit;

        const searchFilter = search ? ilike(containers.id, `%${search}%`) : undefined;

        const result = await db.select({ total: count() })
          .from(containers)
          .where(searchFilter);

        const total = result[0]?.total ?? 0;

        const data = await db.select()
          .from(containers)
          .where(searchFilter)
          .limit(limit)
          .offset(offset);

        return {
          data,
          total,
          page,
          totalPages: Math.ceil(total / limit)
        };
      } catch (error: any) {
        console.error("🔥 ERROR DATABASE:", error);
        return { error: "Terjadi kesalahan pada database", detail: error.message };
      }
    })
    
    // 2. Endpoint Tambah Data Containers Massal (Bulk Insert dari CSV)
    // INI ADALAH BAGIAN YANG BARU DITAMBAHKAN
    .post('/containers/bulk', async ({ body, set }) => {
      try {
        const data = body as any[];

        if (!data || data.length === 0) {
          set.status = 400;
          return { status: 'error', message: 'Data kosong atau tidak valid.' };
        }

        // Formatting data agar sesuai dengan tipe Drizzle & PostgreSQL
          const formattedData = data.map((row) => ({
          id: row.id,
          type: row.type,
          size: Number(row.size), // Pastikan menjadi number karena dari CSV berupa string
          status: row.status,
          weight: row.weight,
          targetDate: row.target_date // <-- UBAH 1: Disesuaikan dengan nama di schema.ts
        }));

        // Eksekusi insert menggunakan Drizzle
        // onConflictDoNothing mencegah error jika ada ID Peti Kemas yang duplikat
        await db.insert(containers)
          .values(formattedData)
          .onConflictDoNothing({ target: containers.id }); // <-- UBAH 2: Menambahkan target primary key

        return { 
          status: 'success', 
          message: `${formattedData.length} data peti kemas berhasil diproses!` 
        };

      } catch (error: any) {
        console.error("🔥 ERROR BULK INSERT:", error);
        set.status = 500;
        return { 
          status: 'error', 
          message: 'Gagal menyimpan data ke database.',
          detail: error.message 
        };
      }
    }, {
      // Validasi: pastikan payload dari frontend adalah bentuk Array
      body: t.Array(t.Any())
    })

    // 3. Eksekusi Optimasi SPK
    .post('/optimize', async ({ body }) => {
      const incomingContainer = body.container as Container;

      const availableSlotsDb = await db
        .select()
        .from(yardSlots)
        .where(eq(yardSlots.status, 'Kosong'));

      if (availableSlotsDb.length === 0) {
        return { error: 'Tidak ada slot kosong yang tersedia di Container Yard.' };
      }

      const formattedSlots = availableSlotsDb.map(slot => ({
        id: slot.id,
        block: slot.blockName,
        tier: slot.tierNum,
        isReeferPlug: slot.isReeferPlug || false,
        distanceToGate: slot.distanceToGate
      }));

      const optimizer = new SmartMethodOptimization();
      const result = optimizer.findBestSlot(incomingContainer, formattedSlots);

      return result;
    }, {
      body: t.Object({
        container: t.Object({
          id: t.String(),
          type: t.String(),
          size: t.Number(),
          status: t.String(),
          weight: t.String()
        })
      })
    })
  )
  .listen(3000);

console.log(`🦊 Backend SPK berjalan di http://${app.server?.hostname}:${app.server?.port}`);