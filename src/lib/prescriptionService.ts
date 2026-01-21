import { Prescription } from '@/types/hospital';
import { apiRequest } from './api';

export function bulkUploadPrescriptions(data: Prescription[]) {
  return apiRequest<{ count: number }>('/api/prescriptions/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
