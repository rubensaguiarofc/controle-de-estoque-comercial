export type StockItem = {
  id: string;
  name: string;
  specifications: string;
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
  unit: string;
  requestedBy: string; // Quem
  requestedFor:string; // Para Quem
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
