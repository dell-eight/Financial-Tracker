import axios from 'axios';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
  baseURL: 'https://api.financialtracker.dev/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the Supabase JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 — clear auth and force re-login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);
