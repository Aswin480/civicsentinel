// Replaces Supabase client with our own backend API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const isCloudEnabled = () => true; // Always enabled for our local backend