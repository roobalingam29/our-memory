/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  full_name: string;
  email: string;
  created_at?: string;
}

export interface Photo {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  photo_date: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SystemHealth {
  status: string;
  database: string;
  storage: string;
}
