import { API_BASE_URL } from "./config";
import type {
  Area,
  Category,
  Goal,
  GoalProgress,
  CreateAreaDto,
  UpdateAreaDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateGoalDto,
  UpdateGoalDto,
} from "@/types/goals";

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

function getFetchOptions(method: string = 'GET', body?: any): RequestInit {
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: getHeaders(),
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return options;
}

// Area API
export const areaApi = {
  async getAll(): Promise<Area[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/areas`, getFetchOptions());
      if (!res.ok) {
        if (res.status === 404 || res.status === 401) return [];
        throw new Error("Failed to fetch areas");
      }
      return res.json();
    } catch (error) {
      console.warn('Areas API not available:', error);
      return [];
    }
  },

  async getOne(id: number): Promise<Area> {
    const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch area");
    return res.json();
  },

  async create(data: CreateAreaDto): Promise<Area> {
    const res = await fetch(`${API_BASE_URL}/areas`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create area");
    return res.json();
  },

  async update(id: number, data: UpdateAreaDto): Promise<Area> {
    const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update area");
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete area");
  },
};

// Category API
export const categoryApi = {
  async getAll(): Promise<Category[]> {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },

  async getByArea(areaId: number): Promise<Category[]> {
    const res = await fetch(`${API_BASE_URL}/categories/area/${areaId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },

  async getOne(id: number): Promise<Category> {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch category");
    return res.json();
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
  },

  async update(id: number, data: UpdateCategoryDto): Promise<Category> {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete category");
  },
};

// Goal API
export const goalApi = {
  async getAll(filters?: {
    isActive?: boolean;
    priority?: string;
    categoryId?: number;
    areaId?: number;
  }): Promise<Goal[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined)
      params.append("isActive", String(filters.isActive));
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.categoryId)
      params.append("categoryId", String(filters.categoryId));
    if (filters?.areaId) params.append("areaId", String(filters.areaId));

    const url = `${API_BASE_URL}/goals${
      params.toString() ? "?" + params.toString() : ""
    }`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch goals");
    return res.json();
  },

  async getByCategory(categoryId: number): Promise<Goal[]> {
    const res = await fetch(`${API_BASE_URL}/goals/category/${categoryId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch goals");
    return res.json();
  },

  async getOne(id: number): Promise<Goal> {
    const res = await fetch(`${API_BASE_URL}/goals/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch goal");
    return res.json();
  },

  async create(data: CreateGoalDto): Promise<Goal> {
    const res = await fetch(`${API_BASE_URL}/goals`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create goal");
    return res.json();
  },

  async update(id: number, data: UpdateGoalDto): Promise<Goal> {
    const res = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update goal");
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete goal");
  },

  async getAllProgress(): Promise<GoalProgress[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/goals/progress`, getFetchOptions());
      if (!res.ok) {
        if (res.status === 404 || res.status === 401) return [];
        throw new Error("Failed to fetch goal progress");
      }
      return res.json();
    } catch (error) {
      console.warn('Goal progress API not available:', error);
      return [];
    }
  },

  async getProgress(id: number): Promise<GoalProgress> {
    const res = await fetch(`${API_BASE_URL}/goals/progress/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch goal progress");
    return res.json();
  },
};
