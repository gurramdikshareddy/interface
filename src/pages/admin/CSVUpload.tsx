import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useHospital } from "@/context/HospitalContext";
import {
  parsePatientCSV,
  parseVisitCSV,
  CSVParseResult,
} from "@/utils/csvParser";
import { Patient, Visit } from "@/types/hospital";
import { toast } from "sonner";

type UploadType = "patients" | "visits";

export default function CSVUpload() {
  const { state } = useHospital();

  const [uploadType, setUploadType] = useState<UploadType>("patients");
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] =
    useState<CSVParseResult<Patient | Visit> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- Helpers ---------------- */

  const chunkArray = <T,>(array: T[], size = 500): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const uploadChunks = async <T,>(
    url: string,
    chunks: T[]
  ): Promise<number> => {
    let saved = 0;

    for (const chunk of chunkArray(chunks)) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Bulk upload failed");
      }

      const data = await res.json();
      saved += data.count ?? chunk.length;
    }

    return saved;
  };

  /* ---------------- Main Handler ---------------- */

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const text = await file.text();

      if (uploadType === "patients") {
        const parseResult = parsePatientCSV(
          text,
          state.patients.map((p) => p.patient_id)
        );

        setResult(parseResult);

        if (parseResult.valid.length > 0) {
          const total = await uploadChunks(
            "/api/patients/bulk",
            parseResult.valid
          );

          toast.success(`✅ ${total} patients uploaded successfully`);
        }
      } else {
        const parseResult = parseVisitCSV(
          text,
          state.visits.map((v) => v.visit_id),
          state.patients.map((p) => p.patient_id),
          state.doctors.map((d) => d.doctor_id)
        );

        setResult(parseResult);

        if (parseResult.valid.length > 0) {
          const total = await uploadChunks(
            "/api/visits/bulk",
            parseResult.valid
          );

          toast.success(`✅ ${total} visits uploaded successfully`);
        }
      }
    } catch (err) {
      console.error("CSV Upload Failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to process CSV"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------------- Drag Events ---------------- */

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

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">CSV Upload</h1>
        <p className="text-muted-foreground">
          Import patients and visits from CSV files
        </p>
      </div>

      <div className="card-healthcare p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {(["patients", "visits"] as UploadType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setUploadType(type);
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                uploadType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {type === "patients" ? "Patients CSV" : "Visits CSV"}
            </button>
          ))}
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />

          <div className="flex flex-col items-center">
            <div className="p-4 rounded-full mb-4 bg-muted">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>

            <p className="text-lg font-medium">
              {isProcessing ? "Processing..." : "Drop CSV file here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>
        </div>

        {/* Columns Info */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/50">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4" />
            Required Columns
          </h3>

          <code className="text-xs text-muted-foreground">
            {uploadType === "patients"
              ? "patient_id, full_name, age, gender, blood_group, phone_number, email, emergency_contact, hospital_location, bmi, smoker_status, alcohol_use, chronic_conditions, registration_date, insurance_type"
              : "visit_id, patient_id, doctor_id, visit_date, severity_score, visit_type, length_of_stay, lab_result_glucose, lab_result_bp, previous_visit_gap_days, readmitted_within_30_days, visit_cost"}
          </code>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card-healthcare p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Summary</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <SummaryBox label="Total" value={result.summary.total} />
            <SummaryBox
              label="Valid"
              value={result.summary.valid}
              icon={<CheckCircle className="w-5 h-5 text-success" />}
            />
            <SummaryBox
              label="Invalid"
              value={result.summary.invalid}
              icon={<XCircle className="w-5 h-5 text-destructive" />}
            />
          </div>

          {result.errors.length > 0 && (
            <>
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Errors
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded bg-destructive/5 border border-destructive/20 text-sm"
                  >
                    <strong>Row {err.row}:</strong> {err.message}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Small UI Component ---------------- */

function SummaryBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 text-center">
      <div className="flex justify-center items-center gap-2 mb-1">
        {icon}
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
