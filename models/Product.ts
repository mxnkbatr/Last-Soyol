export type StockStatus = 'in-stock' | 'pre-order';

export interface Product {
  id: string;
  name: string;
  image?: string | null;
  images?: string[];
  price: number; // Final price after discount
  originalPrice?: number; // Base price before discount
  discountPercent?: number; // 0-100
  discount?: number;
  description?: string;
  category: string;
  featured?: boolean;
  wholesale?: boolean;
  stockStatus?: StockStatus;
  inventory?: number;
  sections?: string[]; // ['Шинэ', 'Бэлэн', etc.]
  attributes?: Record<string, string>;
  rating?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
