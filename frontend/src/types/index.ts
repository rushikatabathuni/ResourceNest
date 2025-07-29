export interface User {
  email: string;
  is_admin: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Bookmark {
  _id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  category: string;
  visit_count: number;
  is_broken: boolean;
  last_checked: string;
  shared: boolean;
  share_id?: string;
  created_at: string;
  updated_at?: string;
  similarity_score?: number;
}

export interface BookmarkCreate {
  title: string;
  url: string;
  description?: string;
}

export interface BookmarkUpdate {
  title?: string;
  url?: string;
  description?: string;
  tags?: string[];
  category?: string;
}

// --- Added Collection and Share types ---

export interface Collection {
  _id: string;
  name: string;
  user_id: string;
  bookmarks: string[]; // Array of bookmark IDs
  created_at: string;
}

export interface CollectionCreate {
  name: string;
  bookmark_ids: string[];
}

export interface CollectionUpdate {
  name: string;
}

export interface ShareResponse {
  share_id: string;
}

// --- End of additions ---

export interface SearchQuery {
  query: string;
  limit?: number;
}

export interface Analytics {
  total_users: number;
  total_bookmarks: number;
  top_tags: Array<{ _id: string; count: number }>;
  top_categories: Array<{ _id: string; count: number }>;
}

export interface Theme {
  mode: 'light' | 'dark';
}
