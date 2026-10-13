export interface ICategory {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  shopId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ICategoryOption {
  id: string;
  name: string;
}