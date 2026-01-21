import React, { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";

import { useHospital } from "@/context/HospitalContext";
import { Visit } from "@/types/hospital";

interface VisitFormProps {
  onClose: () => void;
  visit?: Visit;
}

export function VisitForm({ onClose, visit }: VisitFormProps) {
  const {
    state,
    addVisit,
    updateVisit,
    generateVisitId,
    isVisitIdUnique,
    getPatientById,
    getDoctorById,
  } = useHospital();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [formData, setFormData] = useState<Partial<Visit>>({
    visit_id: visit?.visit_id ?? generateVisitId(),
    patient_id: visit?.patient_id ?? "",
    doctor_id: visit?.doctor_id ?? "",
    visit_date: visit?.visit_date ?? new Date().toISOString().split("T")[0],
    severity_score: visit?.severity_score ?? 0,
    visit_type: visit?.visit_type ?? "OP",
    length_of_stay: visit?.length_of_stay ?? 0,
    lab_result_glucose: visit?.lab_result_glucose ?? 0,
    lab_result_bp: visit?.lab_result_bp ?? "120/80",
    previous_visit_gap_days: visit?.previous_visit_gap_days ?? 0,
    readmitted_within_30_days: visit?.readmitted_within_30_days ?? false,
    visit_cost: visit?.visit_cost ?? 0,
  });

  /* ---------------- Derived state ---------------- */
  const selectedPatient = formData.patient_id
    ? getPatientById(formData.patient_id)
    : undefined;

  const selectedDoctor = formData.doctor_id
    ? getDoctorById(formData.doctor_id)
    : undefined;

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return [];
    return state.patients
      .filter(
        (p) =>
          p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
      )
      .slice(0, 5);
  }, [patientSearch, state.patients]);

  /* ---------------- Effects ---------------- */
  useEffect(() => {
    if (formData.visit_type === "OP") {
      setFormData((prev) => ({
        ...prev,
        length_of_stay: 0,
        readmitted_within_30_days: false,
      }));
    }
  }, [formData.visit_type]);

  /* ---------------- Validation ---------------- */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!formData.visit_id) e.visit_id = "Visit ID is required";
    else if (!visit && !isVisitIdUnique(formData.visit_id))
      e.visit_id = "Visit ID already exists";

    if (!formData.patient_id) e.patient_id = "Patient is required";
    if (!formData.doctor_id) e.doctor_id = "Doctor is required";
    if (!formData.visit_date) e.visit_date = "Visit date is required";

    if (
      formData.severity_score === undefined ||
      formData.severity_score < 0 ||
      formData.severity_score > 5 ||
      !Number.isInteger(formData.severity_score)
    ) {
      e.severity_score = "Severity score must be an integer (0–5)";
    }

    if (
      formData.visit_type === "IP" &&
      (!formData.length_of_stay || formData.length_of_stay < 1)
    ) {
      e.length_of_stay = "Length of stay must be ≥ 1 for IP visits";
    }

    if (formData.lab_result_glucose === undefined || formData.lab_result_glucose < 0)
      e.lab_result_glucose = "Glucose level is required";

    if (!formData.lab_result_bp)
      e.lab_result_bp = "Blood pressure is required";

    if (formData.visit_cost === undefined || formData.visit_cost < 0)
      e.visit_cost = "Visit cost is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const res = await fetch("/api/visits", {
        method: visit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save visit");

      const data = await res.json();

      visit ? updateVisit(data.visit) : addVisit(data.visit);

      toast.success(visit ? "Visit updated successfully" : "Visit added successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error saving visit");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4">
      {/* Visit ID & Date */}
      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="Visit ID"
          value={formData.visit_id}
          onChange={(e) => setFormData({ ...formData, visit_id: e.target.value })}
          className={`input-healthcare ${errors.visit_id ? "border-destructive" : ""}`}
        />
        <input
          type="date"
          value={formData.visit_date}
          onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
          className={`input-healthcare ${errors.visit_date ? "border-destructive" : ""}`}
        />
      </div>

      {/* Patient Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={patientSearch}
          placeholder="Search patient..."
          onChange={(e) => {
            setPatientSearch(e.target.value);
            setShowPatientDropdown(true);
          }}
          className={`input-healthcare pl-10 ${errors.patient_id ? "border-destructive" : ""}`}
        />

        {showPatientDropdown && filteredPatients.length > 0 && (
          <div className="absolute z-10 w-full bg-popover border rounded-lg mt-1">
            {filteredPatients.map((p) => (
              <button
                key={p.patient_id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-muted"
                onClick={() => {
                  setFormData({ ...formData, patient_id: p.patient_id });
                  setPatientSearch(p.full_name);
                  setShowPatientDropdown(false);
                }}
              >
                <p className="font-medium">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">{p.patient_id}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Doctor */}
      <select
        value={formData.doctor_id}
        onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
        className={`input-healthcare ${errors.doctor_id ? "border-destructive" : ""}`}
      >
        <option value="">Select doctor</option>
        {state.doctors.map((d) => (
          <option key={d.doctor_id} value={d.doctor_id}>
            {d.doctor_name} – {d.doctor_speciality}
          </option>
        ))}
      </select>

      {/* Severity & Type */}
      <div className="grid grid-cols-3 gap-4">
        <input
          type="number"
          min={0}
          max={5}
          value={formData.severity_score}
          onChange={(e) =>
            setFormData({ ...formData, severity_score: Number(e.target.value) })
          }
          className="input-healthcare"
        />

        <select
          value={formData.visit_type}
          onChange={(e) =>
            setFormData({ ...formData, visit_type: e.target.value as Visit["visit_type"] })
          }
          className="input-healthcare"
        >
          <option value="OP">Outpatient</option>
          <option value="IP">Inpatient</option>
        </select>

        <input
          type="number"
          min={0}
          disabled={formData.visit_type === "OP"}
          value={formData.length_of_stay}
          onChange={(e) =>
            setFormData({ ...formData, length_of_stay: Number(e.target.value) })
          }
          className="input-healthcare"
        />
      </div>

      {/* Labs & Cost */}
      <div className="grid grid-cols-3 gap-4">
        <input
          type="number"
          step="0.1"
          value={formData.lab_result_glucose}
          onChange={(e) =>
            setFormData({ ...formData, lab_result_glucose: Number(e.target.value) })
          }
          className="input-healthcare"
        />

        <input
          value={formData.lab_result_bp}
          onChange={(e) =>
            setFormData({ ...formData, lab_result_bp: e.target.value })
          }
          className="input-healthcare"
        />

        <input
          type="number"
          step="0.01"
          value={formData.visit_cost}
          onChange={(e) =>
            setFormData({ ...formData, visit_cost: Number(e.target.value) })
          }
          className="input-healthcare"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} className="btn-primary flex gap-2">
          <Check className="w-4 h-4" />
          {visit ? "Update Visit" : "Add Visit"}
        </button>
      </div>
    </div>
  );
}
