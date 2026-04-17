/**
 * Category entity - Pure domain model
 */

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  level: number;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
}
