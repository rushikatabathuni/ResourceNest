import { Collection, CollectionCreate, CollectionUpdate, ShareResponse, Bookmark, AuthResponse, BookmarkCreate, BookmarkUpdate, Analytics } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom error class for API-related errors.
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * A service class to handle all interactions with the backend API.
 */
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Retrieves authentication headers, including the JWT token from localStorage.
   * @returns {HeadersInit} The headers for the request.
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * A generic request handler for all API calls.
   * @template T The expected response type.
   * @param {string} endpoint The API endpoint to call.
   * @param {RequestInit} options The request options (method, body, etc.).
   * @returns {Promise<T>} A promise that resolves with the JSON response.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status} Error` }));
        throw new ApiError(
          response.status,
          errorData.detail || `An unknown error occurred.`
        );
      }
      
      if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('A network error occurred. Please try again.');
    }
  }

  // --- Auth endpoints ---
  async register(email: string, password: string): Promise<AuthResponse> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // --- Bookmark endpoints ---
  async getBookmarks(): Promise<Bookmark[]> {
    return this.request('/bookmarks/');
  }

  async addBookmark(bookmark: BookmarkCreate): Promise<Bookmark> {
    return this.request('/bookmarks/add', {
      method: 'POST',
      body: JSON.stringify(bookmark),
    });
  }

  async editBookmark(id: string, bookmark: BookmarkUpdate): Promise<Bookmark> {
    return this.request(`/bookmarks/edit/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookmark),
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    return this.request(`/bookmarks/delete/${id}`, {
      method: 'DELETE',
    });
  }

  async shareBookmarks(bookmarkIds: string[]): Promise<ShareResponse> {
    return this.request('/bookmarks/share', {
      method: 'POST',
      body: JSON.stringify({ bookmark_ids: bookmarkIds }),
    });
  }
  
  async getSharedBookmarks(shareId: string): Promise<Bookmark[]> {
    return this.request(`/shared/${shareId}`);
  }

  async searchBookmarks(query: string, limit = 20): Promise<Bookmark[]> {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  async getBrokenBookmarks(tag?: string): Promise<{ count: number; bookmarks: Bookmark[] }> {
    const query = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    return this.request(`/bookmarks/broken${query}`);
  }

  async getBookmarksByTag(tag: string): Promise<Bookmark[]> {
    return this.request(`/bookmarks/tag/${encodeURIComponent(tag)}`);
  }

  // --- Collections endpoints ---
  async getCollections(): Promise<Collection[]> {
    return this.request('/collections/');
  }

  async getCollection(id: string): Promise<Collection> {
    return this.request(`/collections/${id}`);
  }

  async createCollection(data: CollectionCreate): Promise<Collection> {
    return this.request('/collections/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: string, data: CollectionUpdate): Promise<Collection> {
    return this.request(`/collections/${id}/rename`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
    });
  }

  async deleteCollection(id: string): Promise<void> {
    return this.request(`/collections/${id}`, { 
        method: 'DELETE' 
    });
  }

  async addBookmarksToCollection(id: string, bookmark_ids: string[]): Promise<Collection> {
    return this.request(`/collections/${id}/add-bookmarks`, { 
        method: 'POST', 
        body: JSON.stringify({ bookmark_ids }) 
    });
  }

  async removeBookmarksFromCollection(id: string, bookmark_ids: string[]): Promise<Collection> {
    return this.request(`/collections/${id}/remove-bookmarks`, { 
        method: 'POST', 
        body: JSON.stringify({ bookmark_ids }) 
    });
  }

  // --- Admin endpoints ---
  async getAnalytics(): Promise<Analytics> {
    return this.request('/admin/analytics');
  }
}

export const apiService = new ApiService();
