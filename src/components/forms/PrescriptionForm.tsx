import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { useHospital } from "@/context/HospitalContext";
import { Prescription, DRUGS_BY_SPECIALTY } from "@/types/hospital";

interface PrescriptionFormProps {
  onClose: () => void;
  doctorId: string;
  doctorSpecialty: string;
}

export function PrescriptionForm({
  onClose,
  doctorId,
  doctorSpecialty,
}: PrescriptionFormProps) {
  const {
    addPrescription,
    generatePrescriptionId,
    getVisitsByDoctor,
    getVisitById,
    getPatientById,
  } = useHospital();

  const visits = getVisitsByDoctor(doctorId);
  const drugs = DRUGS_BY_SPECIALTY[doctorSpecialty] || [];

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Prescription>>({
    prescription_id: generatePrescriptionId(),
    visit_id: "",
    patient_id: "",
    doctor_id: doctorId,
    diagnosis_id: "",
    diagnosis_description: "",
    drug_name: drugs[0]?.name || "",
    drug_category: drugs[0]?.category || "",
    dosage: "",
    quantity: 1,
    days_supply: 7,
    prescribed_date: new Date().toISOString().split("T")[0],
    cost: 0,
  });

  /* ---------------- Auto-fill patient when visit changes ---------------- */
  useEffect(() => {
    if (!formData.visit_id) return;

    const visit = getVisitById(formData.visit_id);
    if (visit) {
      setFormData((prev) => ({
        ...prev,
        patient_id: visit.patient_id,
      }));
    }
  }, [formData.visit_id, getVisitById]);

  /* ---------------- Auto-set drug category ---------------- */
  useEffect(() => {
    const drug = drugs.find((d) => d.name === formData.drug_name);
    if (drug) {
      setFormData((prev) => ({
        ...prev,
        drug_category: drug.category,
      }));
    }
  }, [formData.drug_name, drugs]);

  /* ---------------- Validation ---------------- */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!formData.visit_id) e.visit_id = "Visit is required";
    if (!formData.diagnosis_id?.trim()) e.diagnosis_id = "Diagnosis ID required";
    if (!formData.diagnosis_description?.trim())
      e.diagnosis_description = "Diagnosis description required";
    if (!formData.drug_name) e.drug_name = "Drug required";
    if (!formData.dosage?.trim()) e.dosage = "Dosage required";
    if (!formData.quantity || formData.quantity < 1)
      e.quantity = "Quantity must be ≥ 1";
    if (!formData.days_supply || formData.days_supply < 1)
      e.days_supply = "Days supply must be ≥ 1";
    if (!formData.prescribed_date)
      e.prescribed_date = "Date required";
    if (formData.cost === undefined || formData.cost < 0)
      e.cost = "Invalid cost";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save prescription");

      const data = await res.json();
      addPrescription(data.prescription);

      toast.success("Prescription added successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error saving prescription");
    }
  };

  const selectedVisit = formData.visit_id
    ? getVisitById(formData.visit_id)
    : null;

  const selectedPatient = selectedVisit
    ? getPatientById(selectedVisit.patient_id)
    : null;

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4">
      {/* Visit */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Visit</label>
        <select
          value={formData.visit_id}
          onChange={(e) =>
            setFormData({ ...formData, visit_id: e.target.value })
          }
          className={`input-healthcare ${
            errors.visit_id ? "border-destructive" : ""
          }`}
        >
          <option value="">Select visit</option>
          {visits.map((v) => {
            const patient = getPatientById(v.patient_id);
            return (
              <option key={v.visit_id} value={v.visit_id}>
                {v.visit_id} – {patient?.full_name || v.patient_id} (
                {v.visit_date})
              </option>
            );
          })}
        </select>

        {selectedPatient && (
          <p className="text-xs text-muted-foreground mt-1">
            Patient: {selectedPatient.full_name} ({selectedPatient.patient_id})
          </p>
        )}

        {errors.visit_id && (
          <p className="text-xs text-destructive mt-1">{errors.visit_id}</p>
        )}
      </div>

      {/* Diagnosis */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Diagnosis ID
          </label>
          <input
            type="text"
            value={formData.diagnosis_id}
            onChange={(e) =>
              setFormData({ ...formData, diagnosis_id: e.target.value })
            }
            className={`input-healthcare ${
              errors.diagnosis_id ? "border-destructive" : ""
            }`}
          />
          {errors.diagnosis_id && (
            <p className="text-xs text-destructive mt-1">
              {errors.diagnosis_id}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Prescribed Date
          </label>
          <input
            type="date"
            value={formData.prescribed_date}
            onChange={(e) =>
              setFormData({ ...formData, prescribed_date: e.target.value })
            }
            className={`input-healthcare ${
              errors.prescribed_date ? "border-destructive" : ""
            }`}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Diagnosis Description
        </label>
        <textarea
          rows={2}
          value={formData.diagnosis_description}
          onChange={(e) =>
            setFormData({
              ...formData,
              diagnosis_description: e.target.value,
            })
          }
          className={`input-healthcare ${
            errors.diagnosis_description ? "border-destructive" : ""
          }`}
        />
      </div>

      {/* Drug */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Drug</label>
          <select
            value={formData.drug_name}
            onChange={(e) =>
              setFormData({ ...formData, drug_name: e.target.value })
            }
            className={`input-healthcare ${
              errors.drug_name ? "border-destructive" : ""
            }`}
          >
            {drugs.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Drug Category
          </label>
          <input
            readOnly
            value={formData.drug_category}
            className="input-healthcare bg-muted"
          />
        </div>
      </div>

      {/* Dosage & Cost */}
      <div className="grid grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Dosage"
          value={formData.dosage}
          onChange={(e) =>
            setFormData({ ...formData, dosage: e.target.value })
          }
          className="input-healthcare"
        />

        <input
          type="number"
          min={1}
          value={formData.quantity}
          onChange={(e) =>
            setFormData({
              ...formData,
              quantity: Number(e.target.value) || 1,
            })
          }
          className="input-healthcare"
        />

        <input
          type="number"
          min={0}
          step="0.01"
          value={formData.cost}
          onChange={(e) =>
            setFormData({
              ...formData,
              cost: Number(e.target.value) || 0,
            })
          }
          className="input-healthcare"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button onClick={handleSubmit} className="btn-primary flex gap-2">
          <Check className="w-4 h-4" /> Add Prescription
        </button>
      </div>
    </div>
  );
}
