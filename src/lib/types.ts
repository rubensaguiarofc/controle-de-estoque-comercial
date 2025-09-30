export type StockItem = {
  id: string;
  name: string;
  specifications: string;
  barcode?: string;
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

export type WithdrawalItem = StockItem & {
  quantity: number;
  unit: string;
};
    
