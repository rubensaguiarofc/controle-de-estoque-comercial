
export type StockItem = {
  id: string;
  name: string;
  specifications: string;
  quantity: number;
  barcode?: string;
};

export type WithdrawalItem = {
  item: StockItem;
  quantity: number;
  unit: string;
};

export type WithdrawalRecord = {
  id: string;
  date: string;
  item: StockItem;
  quantity: number;
  returnedQuantity?: number; // Quantidade devolvida
  unit: string;
  requestedBy: string; // Quem
  requestedFor:string; // Para Quem
  // Optional return info: total returned quantity and individual return events
  returnedQuantity?: number;
  returns?: { date: string; quantity: number; note?: string }[];
};

export type EntryRecord = {
    id: string;
    date: string;
    item: StockItem;
    quantity: number;
    unit: string;
    addedBy: string;
};

export type Tool = {
  id: string;
  name: string;
  assetId: string; // Patrimônio
};

export type ToolRecord = {
  id: string;
  tool: Tool;
  checkoutDate: string;
  checkedOutBy: string;
  usageLocation: string;
  checkoutSignature: string; // Data URI da assinatura de retirada
  returnDate?: string;
  isDamaged?: boolean;
  damageDescription?: string;
  damagePhoto?: string; // Data URI da foto
  returnSignature?: string; // Data URI da assinatura de devolução
};

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};
