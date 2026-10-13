export interface ICategory {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  image?: string | null;
  status?: string;
  parentId?: string | null;
  shopId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ICategoryOption {
  id: string;
  name: string;
}