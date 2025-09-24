export type StockItem = {
  id: string;
  name: string;
  specifications: string;
};

export type WithdrawalRecord = {
  id: string;
  date: string;
  item: StockItem;
  quantity: number;
  requestedBy: string; // Quem
  requestedFor:string; // Para Quem
};
