export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

export interface IAPPurchaseResult {
  productId: string;
  transactionId: string;
  transactionReceipt: string;
}

export interface UseIAPResult {
  connected: boolean;
  products: IAPProduct[];
  requestPurchase: (productId: string) => Promise<IAPPurchaseResult>;
  restorePurchases: () => Promise<IAPPurchaseResult>;
  finishTransaction: (purchase: IAPPurchaseResult) => Promise<void>;
}
