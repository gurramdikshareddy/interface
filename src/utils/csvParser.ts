import { Patient, Visit } from '@/types/hospital';

export interface CSVError {
  row: number;
  message: string;
}

export interface CSVParseResult<T> {
  valid: T[];
  errors: CSVError[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

// Parse Patient CSV
export function parsePatientCSV(
  csvText: string,
  existingPatientIds: string[]
): CSVParseResult<Patient> {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  // Skip header row if present
  const startIndex = lines[0].includes('patient_id') ? 1 : 0;
  
  const valid: Patient[] = [];
  const errors: CSVError[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    
    try {
      // Remove quotes from chronic_conditions if present
      let chronicConditions = values[12] || 'None';
      if (chronicConditions.startsWith('"') && chronicConditions.endsWith('"')) {
        chronicConditions = chronicConditions.slice(1, -1);
      }
      
      const patient: Patient = {
        patient_id: values[0] || `PAT${Date.now()}_${i}`,
        full_name: values[1] || 'Unknown',
        age: parseInt(values[2]) || 0,
        gender: (values[3] || 'Unknown') as "Male" | "Female" | "Other",
        blood_group: values[4] || 'O+',
        phone_number: values[5] || '0000000000',
        email: values[6] || '',
        emergency_contact: values[7] || '0000000000',
        hospital_location: values[8] || 'Main Hospital',
        bmi: parseFloat(values[9]) || 22.5,
        smoker_status: values[10] === 'true' || values[10] === '1',
        alcohol_use: values[11] === 'true' || values[11] === '1',
        chronic_conditions: chronicConditions ? chronicConditions.split(';').map(c => c.trim()) : ['None'],
        registration_date: values[13] || new Date().toISOString().split('T')[0],
        insurance_type: values[14] || 'Basic'
      };
      
      // Validate
      if (!patient.patient_id) {
        errors.push({ row: i + 1, message: 'Missing patient_id' });
      } else if (existingPatientIds.includes(patient.patient_id)) {
        errors.push({ row: i + 1, message: `Duplicate patient_id: ${patient.patient_id}` });
      } else if (!patient.full_name || patient.full_name === 'Unknown') {
        errors.push({ row: i + 1, message: 'Missing full_name' });
      } else if (!patient.age || patient.age <= 0) {
        errors.push({ row: i + 1, message: 'Invalid age' });
      } else {
        valid.push(patient);
      }
      
    } catch (err) {
      errors.push({
        row: i + 1,
        message: `Invalid data format: ${err.message}`
      });
    }
  }
  
  return {
    valid,
    errors,
    summary: {
      total: lines.length - startIndex,
      valid: valid.length,
      invalid: errors.length
    }
  };
}

// Parse Visit CSV (Add this function)
export function parseVisitCSV(
  csvText: string,
  existingVisitIds: string[],
  existingPatientIds: string[],
  existingDoctorIds: string[]
): CSVParseResult<Visit> {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  // Skip header row if present
  const startIndex = lines[0].includes('visit_id') ? 1 : 0;
  
  const valid: Visit[] = [];
  const errors: CSVError[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    
    try {
      const visit: Visit = {
        visit_id: values[0] || `VIS${Date.now()}_${i}`,
        patient_id: values[1] || '',
        doctor_id: values[2] || '',
        visit_date: values[3] || new Date().toISOString().split('T')[0],
        severity_score: parseInt(values[4]) || 0,
        visit_type: values[5] === 'IP' ? 'IP' : 'OP',
        length_of_stay: parseInt(values[6]) || 0,
        lab_result_glucose: parseFloat(values[7]) || 0,
        lab_result_bp: values[8] || '120/80',
        previous_visit_gap_days: parseInt(values[9]) || 0,
        readmitted_30_days: values[10] === 'true' || values[10] === '1',
        visit_cost: parseFloat(values[11]) || 0
      };
      
      // Validate
      if (!visit.visit_id) {
        errors.push({ row: i + 1, message: 'Missing visit_id' });
      } else if (existingVisitIds.includes(visit.visit_id)) {
        errors.push({ row: i + 1, message: `Duplicate visit_id: ${visit.visit_id}` });
      } else if (!visit.patient_id) {
        errors.push({ row: i + 1, message: 'Missing patient_id' });
      } else if (!existingPatientIds.includes(visit.patient_id)) {
        errors.push({ row: i + 1, message: `Patient not found: ${visit.patient_id}` });
      } else if (!visit.doctor_id) {
        errors.push({ row: i + 1, message: 'Missing doctor_id' });
      } else if (!existingDoctorIds.includes(visit.doctor_id)) {
        errors.push({ row: i + 1, message: `Doctor not found: ${visit.doctor_id}` });
      } else if (visit.severity_score < 0 || visit.severity_score > 5) {
        errors.push({ row: i + 1, message: `Invalid severity_score: ${visit.severity_score}. Must be 0-5` });
      } else {
        valid.push(visit);
      }
      
    } catch (err) {
      errors.push({
        row: i + 1,
        message: `Invalid data format: ${err.message}`
      });
    }
  }
  
  return {
    valid,
    errors,
    summary: {
      total: lines.length - startIndex,
      valid: valid.length,
      invalid: errors.length
    }
  };
}

// Parse Prescription CSV (Optional - add if needed)
export function parsePrescriptionCSV(
  csvText: string,
  existingPrescriptionIds: string[],
  existingPatientIds: string[],
  existingDoctorIds: string[],
  existingVisitIds: string[]
): CSVParseResult<any> {
  // Similar implementation for prescriptions
  return {
    valid: [],
    errors: [],
    summary: { total: 0, valid: 0, invalid: 0 }
  };
}