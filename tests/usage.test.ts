import { describe, it, expect } from 'vitest';
import { computeUsageSummary, computeSelectedItemTotalsByUnit } from '@/lib/usage';
import type { WithdrawalRecord, StockItem } from '@/lib/types';

function mkItem(id: string, name: string, specifications: string): StockItem {
  return { id, name, specifications, quantity: 0 };
}

describe('usage utils', () => {
  const itemA = mkItem('1', 'Parafuso 10mm', 'Aço');
  const itemB = mkItem('2', 'Cabo Elétrico', '2m 750V');
  const baseDate = new Date().toISOString();

  const records: WithdrawalRecord[] = [
    { id: 'w1', date: baseDate, item: itemA, quantity: 20, returnedQuantity: 5, unit: 'un', requestedBy: 'Carlos', requestedFor: 'Obra A' },
    { id: 'w2', date: baseDate, item: itemA, quantity: 3, returnedQuantity: 0, unit: 'cx', requestedBy: 'João', requestedFor: 'Obra B' },
    { id: 'w3', date: baseDate, item: itemB, quantity: 10, returnedQuantity: 0, unit: 'm', requestedBy: 'Ana', requestedFor: 'Obra B' },
    { id: 'w4', date: baseDate, item: itemA, quantity: 2, returnedQuantity: 1, unit: 'un', requestedBy: 'Carlos', requestedFor: 'Obra A' },
  ];

  it('computes usage summary grouped by item+unit with returned quantities deducted', () => {
    const rows = computeUsageSummary(records);
    // Expected:
    // itemA/un: (20-5) + (2-1) = 16
    // itemA/cx: 3 - 0 = 3
    // itemB/m: 10 - 0 = 10
    const map = new Map(rows.map(r => [`${r.name}__${r.unit}`, r.totalUsed]));
    expect(map.get('Parafuso 10mm__un')).toBe(16);
    expect(map.get('Parafuso 10mm__cx')).toBe(3);
    expect(map.get('Cabo Elétrico__m')).toBe(10);
  });

  it('computes per-unit totals for a selected item', () => {
    const totals = computeSelectedItemTotalsByUnit(records, 'Parafuso 10mm');
    const m = new Map(totals.map(t => [t.unit, t.totalUsed]));
    expect(m.get('un')).toBe(16);
    expect(m.get('cx')).toBe(3);
    expect(m.has('m')).toBeFalsy();
  });
});
