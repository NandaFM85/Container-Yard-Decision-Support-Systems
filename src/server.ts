import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from './db';
import { containers, yardSlots } from './db/schema'; // <-- Import variabel dari schema.ts
import { ilike, count, eq } from 'drizzle-orm';
import { SmartMethodOptimization, type Container } from './services/spk';

const app = new Elysia()
  .use(cors())
  .group('/api', (app) => app
    
    // Endpoint Ambil Data Containers
    .get('/containers', async ({ query }) => {
      try {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const search = query.search || '';
        const offset = (page - 1) * limit;

        // Jika search kosong, searchFilter = undefined (Drizzle otomatis abaikan WHERE)
        const searchFilter = search ? ilike(containers.id, `%${search}%`) : undefined;

        // Eksekusi Drizzle yang setara dengan: SELECT count(*) FROM public.containers
        const result = await db.select({ total: count() })
          .from(containers)
          .where(searchFilter);

        const total = result[0]?.total ?? 0;

        // Eksekusi Drizzle yang setara dengan: SELECT * FROM public.containers LIMIT .. OFFSET ..
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

    // 2. Eksekusi Optimasi SPK
    .post('/optimize', async ({ body }) => {
      const incomingContainer = body.container as Container;

      // Ambil slot yang masih kosong dari database
      const availableSlotsDb = await db
        .select()
        .from(yardSlots)
        .where(eq(yardSlots.status, 'Kosong'));

      if (availableSlotsDb.length === 0) {
        return { error: 'Tidak ada slot kosong yang tersedia di Container Yard.' };
      }

      // Format data untuk dimasukkan ke sistem SPK
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
      // Validasi payload (mencegah error kalau frontend kirim data kosong)
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