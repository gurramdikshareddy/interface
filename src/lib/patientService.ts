import { Patient } from '@/types/hospital';
import { apiRequest } from './api';

export function bulkUploadPatients(data: Patient[]) {
  return apiRequest<{ count: number }>('/api/patients/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
