export type AppStatus = 'ok' | 'error';

export interface HealthResponse {
  status: AppStatus;
  service: string;
  timestamp: string;
}

export const createHealthResponse = (service: string): HealthResponse => ({
  status: 'ok',
  service,
  timestamp: new Date().toISOString(),
});
