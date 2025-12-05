// Lightweight pending operations queue for offline support
// Stores pending operations in localStorage under the key 'pending:ops'

import type { StockRepo } from './data/firestore-repo';

const KEY = 'pending:ops';

export type PendingOp = {
  id: string;
  type: 'entry' | 'withdrawal' | 'toolCheckout' | 'toolReturn';
  payload: any;
  createdAt: string;
};

export function getPendingOps(): PendingOp[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as PendingOp[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setPendingOps(list: PendingOp[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function pushPendingOp(op: Omit<PendingOp, 'createdAt'>) {
  try {
    const list = getPendingOps();
    const p: PendingOp = { ...op, createdAt: new Date().toISOString() } as PendingOp;
    list.push(p);
    setPendingOps(list);
    return p;
  } catch {
    return null as any;
  }
}

export async function flushPendingOps(repo: StockRepo | null) {
  if (!repo) return;
  const list = getPendingOps();
  if (!list.length) return;
  const remaining: PendingOp[] = [];
  for (const op of list) {
    try {
      if (op.type === 'entry') {
        await repo.addEntry(op.payload);
      } else if (op.type === 'withdrawal') {
        await repo.addWithdrawal(op.payload);
      } else if (op.type === 'toolCheckout') {
        await repo.addToolCheckout(op.payload);
      } else if (op.type === 'toolReturn') {
        // payload expected { id, returnData }
        await repo.updateToolReturn(op.payload.id, op.payload.returnData);
      }
      // success -> don't keep
    } catch (err) {
      // keep op for later retry
      remaining.push(op);
    }
  }
  setPendingOps(remaining);
}

export function clearPendingOps() {
  try { localStorage.removeItem(KEY); } catch {}
}
