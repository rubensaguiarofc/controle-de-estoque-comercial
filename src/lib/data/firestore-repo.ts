"use client";

import { collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc, addDoc, serverTimestamp, increment } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { StockItem, EntryRecord, WithdrawalRecord } from "@/lib/types";

export class StockRepo {
  constructor(private db: Firestore) {}

  itemsCol() { return collection(this.db, 'stockItems'); }
  entriesCol() { return collection(this.db, 'entries'); }
  withdrawalsCol() { return collection(this.db, 'withdrawals'); }

  onItems(cb: (items: StockItem[]) => void) {
    const q = query(this.itemsCol(), orderBy('name'));
    return onSnapshot(q, (snap) => {
      const items: StockItem[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      cb(items);
    });
  }

  onEntries(cb: (records: EntryRecord[]) => void) {
    // Order by server timestamp when available; fallback to client date if needed
    const q = query(this.entriesCol(), orderBy('createdAt'));
    return onSnapshot(q, (snap) => {
      const list: EntryRecord[] = snap.docs.map(d => {
        const data = d.data() as any;
        // Ensure we always have an id set
        return { id: d.id, ...data } as EntryRecord;
      });
      cb(list);
    });
  }

  onWithdrawals(cb: (records: WithdrawalRecord[]) => void) {
    const q = query(this.withdrawalsCol(), orderBy('createdAt'));
    return onSnapshot(q, (snap) => {
      const list: WithdrawalRecord[] = snap.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, ...data } as WithdrawalRecord;
      });
      cb(list);
    });
  }

  async upsertItem(item: StockItem) {
    const ref = doc(this.itemsCol(), item.id);
    await setDoc(ref, item, { merge: true });
  }

  async addEntry(rec: EntryRecord) {
    await addDoc(this.entriesCol(), { ...rec, createdAt: serverTimestamp() });
    const itemRef = doc(this.itemsCol(), rec.item.id);
    await updateDoc(itemRef, { quantity: increment(rec.quantity) });
  }

  async addWithdrawal(rec: WithdrawalRecord) {
    await addDoc(this.withdrawalsCol(), { ...rec, createdAt: serverTimestamp() });
    const itemRef = doc(this.itemsCol(), rec.item.id);
    await updateDoc(itemRef, { quantity: increment(-rec.quantity) });
  }
}
