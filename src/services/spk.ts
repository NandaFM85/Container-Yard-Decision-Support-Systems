export type ContainerWeight = 'Ringan' | 'Sedang' | 'Berat';

export interface Container {
    id: string;
    type: string;
    size: number;
    status: string;
    weight: string;
}

export interface YardSlot {
    id: string;
    block: string;
    tier: number;
    isReeferPlug: boolean;
    distanceToGate: number;
}

const CRITERIA = {
    weightSuitability: { weight: 80, type: 'benefit' },
    distance: { weight: 90, type: 'cost' },
    typeMatch: { weight: 100, type: 'benefit' }
};

const totalWeight = Object.values(CRITERIA).reduce((acc, curr) => acc + curr.weight, 0);
const normalizedWeights = {
    weightSuitability: CRITERIA.weightSuitability.weight / totalWeight,
    distance: CRITERIA.distance.weight / totalWeight,
    typeMatch: CRITERIA.typeMatch.weight / totalWeight,
};

export class SmartMethodOptimization {
    private getWeightUtility(containerWeight: string, slotTier: number): number {
        if (containerWeight === 'Berat') {
            return slotTier === 1 ? 100 : slotTier === 2 ? 60 : 0;
        } else if (containerWeight === 'Sedang') {
            return (slotTier >= 2 && slotTier <= 3) ? 100 : 50;
        } else {
            return slotTier >= 4 ? 100 : 40; 
        }
    }

    private getDistanceUtility(distance: number, maxDistance: number = 1000): number {
        const utility = ((maxDistance - distance) / maxDistance) * 100;
        return Math.max(0, utility);
    }

    private getTypeUtility(containerType: string, isReeferPlug: boolean): number {
        if (containerType === 'Reefer') return isReeferPlug ? 100 : 0;
        return isReeferPlug ? 0 : 100; 
    }

    public findBestSlot(container: Container, availableSlots: YardSlot[]) {
        const results = availableSlots.map(slot => {
            const uWeight = this.getWeightUtility(container.weight, slot.tier);
            const uDistance = this.getDistanceUtility(slot.distanceToGate);
            const uType = this.getTypeUtility(container.type, slot.isReeferPlug);

            const finalScore = 
                (uWeight * normalizedWeights.weightSuitability) +
                (uDistance * normalizedWeights.distance) +
                (uType * normalizedWeights.typeMatch);

            return {
                slotId: slot.id,
                scores: { uWeight, uDistance, uType },
                finalScore: parseFloat(finalScore.toFixed(2))
            };
        });

        results.sort((a, b) => b.finalScore - a.finalScore);

        return {
            containerId: container.id,
            recommendedSlot: results[0] || null,
            ranking: results
        };
    }
}