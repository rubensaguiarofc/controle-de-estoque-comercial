"use client";

import { collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc, addDoc, serverTimestamp, increment, deleteDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { StockItem, EntryRecord, WithdrawalRecord, Tool, ToolRecord } from "@/lib/types";

export class StockRepo {
  constructor(private db: Firestore) {}

  itemsCol() { return collection(this.db, 'stockItems'); }
  entriesCol() { return collection(this.db, 'entries'); }
  withdrawalsCol() { return collection(this.db, 'withdrawals'); }
  toolsCol() { return collection(this.db, 'tools'); }
  toolHistoryCol() { return collection(this.db, 'toolHistory'); }

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

  async deleteItem(itemId: string) {
    const ref = doc(this.itemsCol(), itemId);
    await deleteDoc(ref);
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

  // Tool management methods
  onTools(cb: (tools: Tool[]) => void) {
    const q = query(this.toolsCol(), orderBy('name'));
    return onSnapshot(q, (snap) => {
      const tools: Tool[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      cb(tools);
    });
  }

  onToolHistory(cb: (records: ToolRecord[]) => void) {
    const q = query(this.toolHistoryCol(), orderBy('checkoutDate', 'desc'));
    return onSnapshot(q, (snap) => {
      const list: ToolRecord[] = snap.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, ...data } as ToolRecord;
      });
      cb(list);
    });
  }

  async upsertTool(tool: Tool) {
    const ref = doc(this.toolsCol(), tool.id);
    await setDoc(ref, tool, { merge: true });
  }

  async deleteTool(toolId: string) {
    const ref = doc(this.toolsCol(), toolId);
    await deleteDoc(ref);
  }

  async addToolCheckout(rec: ToolRecord) {
    const ref = doc(this.toolHistoryCol(), rec.id);
    await setDoc(ref, { ...rec, createdAt: serverTimestamp() });
  }

  async updateToolReturn(recordId: string, returnData: Partial<ToolRecord>) {
    const ref = doc(this.toolHistoryCol(), recordId);
    await updateDoc(ref, { ...returnData, updatedAt: serverTimestamp() });
  }
}
