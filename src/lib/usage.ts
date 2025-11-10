import type { WithdrawalRecord } from '@/lib/types';

export type UsageRow = { name: string; specifications: string; unit: string; totalUsed: number };

// Soma das quantidades efetivamente usadas (retiradas - devolvidas), agregando por item+unidade
export function computeUsageSummary(records: WithdrawalRecord[]): UsageRow[] {
  const map = new Map<string, UsageRow>();
  for (const r of records || []) {
    const used = (r.quantity || 0) - (r.returnedQuantity || 0);
    const key = `${r.item.name}__${r.unit}`;
    const prev = map.get(key) || { name: r.item.name, specifications: r.item.specifications, unit: r.unit, totalUsed: 0 };
    prev.totalUsed += used;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) => (b.totalUsed - a.totalUsed));
}

// Totais usados por unidade para um item específico
export function computeSelectedItemTotalsByUnit(records: WithdrawalRecord[], itemName: string): { unit: string; totalUsed: number }[] {
  const map = new Map<string, number>();
  for (const r of records || []) {
    if (r.item.name !== itemName) continue;
    const used = (r.quantity || 0) - (r.returnedQuantity || 0);
    map.set(r.unit, (map.get(r.unit) || 0) + used);
  }
  return Array.from(map.entries()).map(([unit, totalUsed]) => ({ unit, totalUsed })).sort((a, b) => b.totalUsed - a.totalUsed);
}
