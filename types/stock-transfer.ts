export type TransferStatus = "DISPATCHED" | "COMPLETED" | "CANCELLED";

export interface IStockBranchOption {
  id: string;
  name: string;
  isMain: boolean;
}

export interface IStockProductOption {
  id: string;
  name: string;
  barcode: string;
  brandName: string;
  unitCode: string;
  costPrice: number;
  stockQuantity: number;
}

export interface IStockTransferItem {
  id?: string;
  productId: string;
  productName: string;
  barcode?: string | null;
  unitCode?: string;
  quantitySent: number;
  quantityReceived?: number | null;
  transitDamage?: number;
  unitCost: number;
  lineCost: number;
}

export interface IStockTransfer {
  id: string;
  transferNo: string;
  dispatchDate: Date | string;
  receiveDate?: Date | string | null;
  status: TransferStatus;
  totalItems: number;
  totalQuantity: number;
  totalCost: number;
  notes?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicleNo?: string | null;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  items: IStockTransferItem[];
  createdAt: Date | string;
}

export interface IStockTransferListFilters {
  q?: string;
  direction?: string;
}

export interface IPaginatedStockTransfers {
  items: IStockTransfer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTransferPayload {
  toBranchId: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
}