import React, { useMemo, useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { parsePrescriptionCSV, CSVParseResult } from '@/utils/csvParser';
import { Prescription } from '@/types/hospital';
import { toast } from 'sonner';

const CHUNK_SIZE = 500;

export default function DoctorCSVUpload() {
  const { state, addPrescriptions, getVisitsByDoctor } = useHospital();
  const { user } = state.auth;

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CSVParseResult<Prescription> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const doctorId = user?.doctor_id ?? '';

  // 🔹 Fetch doctor visits only once
  const doctorVisitIds = useMemo(() => {
    if (!doctorId) return [];
    return getVisitsByDoctor(doctorId).map(v => v.visit_id);
  }, [doctorId, getVisitsByDoctor]);

  // 🔹 Utility: Split large array into chunks
  const chunkArray = <T,>(data: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < data.length; i += size) {
      chunks.push(data.slice(i, i + size));
    }
    return chunks;
  };

  // 🔹 Upload prescriptions to backend
  const uploadPrescriptions = async (prescriptions: Prescription[]) => {
    const chunks = chunkArray(prescriptions, CHUNK_SIZE);
    let uploaded = 0;

    for (const chunk of chunks) {
      try {
        const response = await fetch('/api/prescriptions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || `Upload failed (${response.status})`);
        }

        const data = await response.json();
        uploaded += data.count ?? chunk.length;
      } catch (error: any) {
        console.error('❌ Upload error:', error);
        toast.error(`Failed to upload some prescriptions: ${error.message}`);
      }
    }

    return uploaded;
  };

  // 🔹 Handle CSV file
  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const csvText = await file.text();

      const parseResult = parsePrescriptionCSV(
        csvText,
        state.prescriptions.map(p => p.prescription_id),
        state.visits.map(v => v.visit_id),
        doctorId,
        doctorVisitIds
      );

      setResult(parseResult);

      if (parseResult.valid.length === 0) {
        toast.warning('No valid prescriptions found in CSV');
        return;
      }

      console.log('🔄 Uploading prescriptions:', parseResult.valid.length);

      const totalUploaded = await uploadPrescriptions(parseResult.valid);

      console.log('✅ Total uploaded:', totalUploaded);

      // Update UI immediately
      addPrescriptions(parseResult.valid);

      toast.success(`Uploaded ${totalUploaded} prescriptions successfully`);
    } catch (error: any) {
      console.error('❌ CSV processing failed:', error);
      toast.error(error.message || 'Failed to process CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔹 Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">CSV Upload</h1>
        <p className="text-muted-foreground mt-1">
          Import prescriptions from CSV file
        </p>
      </div>

      {/* Upload Card */}
      <div className="card-healthcare p-6">
        {/* Info */}
        <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">
            <strong>Note:</strong> You can upload prescriptions only for your own visits.
            The CSV must contain your doctor_id ({doctorId}) and valid visit_ids.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <div className="flex flex-col items-center">
            <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            <p className="text-lg font-medium text-foreground mb-2">
              {isProcessing ? 'Processing...' : 'Drop prescriptions CSV here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>
        </div>

        {/* Required Columns */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/50">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Required Columns
          </h3>
          <code className="text-xs text-muted-foreground">
            prescription_id, visit_id, patient_id, doctor_id, diagnosis_id,
            diagnosis_description, drug_name, drug_category, dosage, quantity,
            days_supply, prescribed_date, cost
          </code>
        </div>
      </div>

      {/* Result Summary */}
      {result && (
        <div className="card-healthcare p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Upload Summary
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <SummaryBox label="Total Rows" value={result.summary.total} />
            <SummaryBox
              label="Valid & Imported"
              value={result.summary.valid}
              success
              icon={<CheckCircle className="w-5 h-5 text-success" />}
            />
            <SummaryBox
              label="Invalid & Rejected"
              value={result.summary.invalid}
              danger
              icon={<XCircle className="w-5 h-5 text-destructive" />}
            />
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Error Details
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <p className="text-sm">
                      <span className="font-medium text-destructive">
                        Row {error.row}:
                      </span>{' '}
                      <span className="text-foreground">{error.message}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -----------------------------------
   Reusable Summary UI Component
------------------------------------ */

type SummaryBoxProps = {
  label: string;
  value: number;
  icon?: React.ReactNode;
  success?: boolean;
  danger?: boolean;
};

function SummaryBox({ label, value, icon, success, danger }: SummaryBoxProps) {
  const bg = success
    ? 'bg-success/10'
    : danger
    ? 'bg-destructive/10'
    : 'bg-muted/50';

  const text = success
    ? 'text-success'
    : danger
    ? 'text-destructive'
    : 'text-foreground';

  return (
    <div className={`p-4 rounded-lg ${bg} text-center`}>
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <p className={`text-2xl font-bold ${text}`}>{value}</p>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
