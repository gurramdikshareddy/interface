import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useHospital } from "@/context/HospitalContext";
import { Patient, BLOOD_GROUPS, CHRONIC_CONDITIONS } from "@/types/hospital";
import { toast } from "sonner";

interface PatientFormProps {
  onClose: () => void;
  patient?: Patient;
}

export function PatientForm({ onClose, patient }: PatientFormProps) {
  const {
    addPatient,
    updatePatient,
    generatePatientId,
    isPatientIdUnique,
  } = useHospital();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Patient>({
    patient_id: patient?.patient_id || generatePatientId(),
    full_name: patient?.full_name || "",
    age: patient?.age || 0,
    gender: patient?.gender || "Male",
    blood_group: patient?.blood_group || "O+",
    phone_number: patient?.phone_number || "",
    email: patient?.email || "",
    emergency_contact: patient?.emergency_contact || "",
    hospital_location: patient?.hospital_location || "",
    bmi: patient?.bmi || 0,
    smoker_status: patient?.smoker_status || false,
    alcohol_use: patient?.alcohol_use || false,
    chronic_conditions: patient?.chronic_conditions || [],
    registration_date:
      patient?.registration_date ||
      new Date().toISOString().split("T")[0],
    insurance_type: patient?.insurance_type || "",
  });

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patient_id)
      newErrors.patient_id = "Patient ID is required";
    else if (!patient && !isPatientIdUnique(formData.patient_id))
      newErrors.patient_id = "Patient ID already exists";

    if (!formData.full_name.trim())
      newErrors.full_name = "Full name is required";

    if (formData.age < 0 || formData.age > 150)
      newErrors.age = "Age must be between 0–150";

    if (!formData.phone_number.trim())
      newErrors.phone_number = "Phone number is required";

    if (!formData.email.trim())
      newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.emergency_contact.trim())
      newErrors.emergency_contact = "Emergency contact is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hospital_location.trim())
      newErrors.hospital_location = "Hospital location is required";

    if (formData.bmi < 10 || formData.bmi > 100)
      newErrors.bmi = "BMI must be between 10–100";

    if (!formData.registration_date)
      newErrors.registration_date = "Registration date is required";

    if (!formData.insurance_type.trim())
      newErrors.insurance_type = "Insurance type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    try {
      const url = patient
        ? `${import.meta.env.VITE_API_BASE_URL}/api/patients/${formData.patient_id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/patients`;

      const response = await fetch(url, {
        method: patient ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const savedPatient = await response.json();

      if (!response.ok) {
        throw new Error(savedPatient.message || "Failed to save patient");
      }

      if (patient) {
        updatePatient(savedPatient);
        toast.success("Patient updated successfully");
      } else {
        addPatient(savedPatient);
        toast.success("Patient added successfully");
      }

      onClose();
    } catch (err: any) {
      console.error("SAVE PATIENT ERROR:", err);
      toast.error(err.message || "Error saving patient");
    }
  };

  const handleConditionToggle = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions.includes(condition)
        ? prev.chronic_conditions.filter((c) => c !== condition)
        : [...prev.chronic_conditions, condition],
    }));
  };

  /* ---------- UI BELOW (UNCHANGED STRUCTURE) ---------- */
  // 👉 Everything else in your JSX remains exactly the same
