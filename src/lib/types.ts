
export type StockItem = {
  id: string;
  name: string;
  specifications: string;
  quantity: number;
  unit?: string; // unidade padrão do item (ex: un, kg, l, box)
  // barcode may be a string or null when intentionally empty (avoid undefined when writing to Firestore)
  barcode?: string | null;
  category?: string;
  location?: string;
};

export type WithdrawalItem = {
  item: StockItem;
  quantity: number;
  unit: string;
  // Optional unique key to distinguish entries of the same item with different units in the cart
  cartKey?: string;
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
  isActive?: boolean;
};

export type ToolRecord = {
  id: string;
  tool: Tool;
  checkoutDate: string;
  checkedOutBy: string;
  company?: string; // Empresa de quem está retirando
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
