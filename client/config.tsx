/// <reference types="vite/client" />

// Ensure TypeScript treats this file as a module
export {};

// Define the interface locally if global types fail
interface ImportMetaEnv {
  readonly PROD: boolean;
  // Add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Force cast to bypass the type check if environment is stubborn
const env = (import.meta as unknown as ImportMeta).env;

// Logic: If in production (Vercel), use relative path. If local, use port 4000.
export const API_BASE_URL = env?.PROD ? "" : "http://localhost:4000";