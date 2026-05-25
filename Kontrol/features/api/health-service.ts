import { apiGet } from './api';

export type BackendHealth = {
  ok?: boolean;
  status?: string;
  timestamp?: string;
  service?: string;
};

export async function checkBackendHealth(): Promise<BackendHealth> {
  return apiGet<BackendHealth>('/health', { auth: false });
}
