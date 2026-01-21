import { Visit } from '@/types/hospital';
import { apiRequest } from './api';

export function bulkUploadVisits(data: Visit[]) {
  return apiRequest<{ count: number }>('/api/visits/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
