import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import {
  Patient,
  Doctor,
  Visit,
  Prescription,
  User,
  AuthState,
  DEMO_CREDENTIALS,
  SeverityChange,
} from "@/types/hospital";
import { toast } from "sonner";

/* ---------------- Types ---------------- */

interface HospitalState {
  patients: Patient[];
  doctors: Doctor[];
  visits: Visit[];
  prescriptions: Prescription[];
  auth: AuthState;
}

type HospitalAction =
  | { type: "SET_PATIENTS"; payload: Patient[] }
  | { type: "SET_DOCTORS"; payload: Doctor[] }
  | { type: "SET_VISITS"; payload: Visit[] }
  | { type: "SET_PRESCRIPTIONS"; payload: Prescription[] }
  | { type: "ADD_PATIENT"; payload: Patient }
  | { type: "DELETE_PATIENT"; payload: string }
  | { type: "ADD_DOCTOR"; payload: Doctor }
  | { type: "DELETE_DOCTOR"; payload: string }
  | { type: "ADD_VISIT"; payload: Visit }
  | { type: "DELETE_VISIT"; payload: string }
  | { type: "ADD_PRESCRIPTION"; payload: Prescription }
  | { type: "DELETE_PRESCRIPTION"; payload: string }
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" };

/* ---------------- Initial State ---------------- */

const initialState: HospitalState = {
  patients: [],
  doctors: [],
  visits: [],
  prescriptions: [],
  auth: {
    user: null,
    isAuthenticated: false,
  },
};

/* ---------------- Reducer ---------------- */

function hospitalReducer(
  state: HospitalState,
  action: HospitalAction
): HospitalState {
  switch (action.type) {
    case "SET_PATIENTS":
      return { ...state, patients: action.payload };

    case "SET_DOCTORS":
      return { ...state, doctors: action.payload };

    case "SET_VISITS":
      return { ...state, visits: action.payload };

    case "SET_PRESCRIPTIONS":
      return { ...state, prescriptions: action.payload };

    case "ADD_PATIENT":
      return { ...state, patients: [...state.patients, action.payload] };

    case "DELETE_PATIENT":
      return {
        ...state,
        patients: state.patients.filter(
          (p) => p.patient_id !== action.payload
        ),
      };

    case "ADD_DOCTOR":
      return { ...state, doctors: [...state.doctors, action.payload] };

    case "DELETE_DOCTOR":
      return {
        ...state,
        doctors: state.doctors.filter(
          (d) => d.doctor_id !== action.payload
        ),
      };

    case "ADD_VISIT":
      return { ...state, visits: [...state.visits, action.payload] };

    case "DELETE_VISIT":
      return {
        ...state,
        visits: state.visits.filter((v) => v.visit_id !== action.payload),
      };

    case "ADD_PRESCRIPTION":
      return {
        ...state,
        prescriptions: [...state.prescriptions, action.payload],
      };

    case "DELETE_PRESCRIPTION":
      return {
        ...state,
        prescriptions: state.prescriptions.filter(
          (p) => p.prescription_id !== action.payload
        ),
      };

    case "LOGIN":
      return { ...state, auth: { user: action.payload, isAuthenticated: true } };

    case "LOGOUT":
      return { ...state, auth: { user: null, isAuthenticated: false } };

    default:
      return state;
  }
}

/* ---------------- Context ---------------- */

interface HospitalContextType {
  state: HospitalState;

  addPatient: (patient: Patient) => void;
  deletePatient: (id: string) => Promise<void>;

  addDoctor: (doctor: Doctor) => void;
  deleteDoctor: (id: string) => Promise<void>;

  addVisit: (visit: Visit) => void;
  deleteVisit: (id: string) => Promise<void>;

  addPrescription: (p: Prescription) => void;
  deletePrescription: (id: string) => Promise<void>;

  login: (
    userId: string,
    password: string,
    portal: "admin" | "doctor"
  ) => { success: boolean; error?: string };

  logout: () => void;

  generatePatientId: () => string;
  generateDoctorId: () => string;
  generateVisitId: () => string;
  generatePrescriptionId: () => string;

  isDoctorUserIdUnique: (userId: string) => boolean;
}

const HospitalContext = createContext<HospitalContextType | undefined>(
  undefined
);

/* ---------------- Provider ---------------- */

export function HospitalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(hospitalReducer, initialState);

  /* ---------- API Fetchers ---------- */

  const fetchPatients = async () => {
    const res = await fetch("/api/patients");
    const data = await res.json();
    dispatch({ type: "SET_PATIENTS", payload: data });
  };

  const fetchDoctors = async () => {
    const res = await fetch("/api/doctors");
    const data = await res.json();
    dispatch({ type: "SET_DOCTORS", payload: data });
  };

  const fetchVisits = async () => {
    const res = await fetch("/api/visits");
    const data = await res.json();
    dispatch({ type: "SET_VISITS", payload: data });
  };

  const fetchPrescriptions = async () => {
    const res = await fetch("/api/prescriptions");
    const data = await res.json();
    dispatch({ type: "SET_PRESCRIPTIONS", payload: data });
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchVisits();
    fetchPrescriptions();
  }, []);

  /* ---------- Actions ---------- */

  const addPatient = useCallback((patient: Patient) => {
    dispatch({ type: "ADD_PATIENT", payload: patient });
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    dispatch({ type: "DELETE_PATIENT", payload: id });
  }, []);

  const addDoctor = useCallback((doctor: Doctor) => {
    dispatch({ type: "ADD_DOCTOR", payload: doctor });
  }, []);

  const deleteDoctor = useCallback(async (id: string) => {
    await fetch(`/api/doctors/${id}`, { method: "DELETE" });
    dispatch({ type: "DELETE_DOCTOR", payload: id });
  }, []);

  const addVisit = useCallback((visit: Visit) => {
    dispatch({ type: "ADD_VISIT", payload: visit });
  }, []);

  const deleteVisit = useCallback(async (id: string) => {
    await fetch(`/api/visits/${id}`, { method: "DELETE" });
    dispatch({ type: "DELETE_VISIT", payload: id });
  }, []);

  const addPrescription = useCallback((p: Prescription) => {
    dispatch({ type: "ADD_PRESCRIPTION", payload: p });
  }, []);

  const deletePrescription = useCallback(async (id: string) => {
    await fetch(`/api/prescriptions/${id}`, { method: "DELETE" });
    dispatch({ type: "DELETE_PRESCRIPTION", payload: id });
  }, []);

  /* ---------- Auth ---------- */

  const login = useCallback(
    (userId: string, password: string, portal: "admin" | "doctor") => {
      if (
        portal === "admin" &&
        userId === DEMO_CREDENTIALS.admin.user_id &&
        password === DEMO_CREDENTIALS.admin.password
      ) {
        const user: User = { user_id: userId, role: "admin" };
        dispatch({ type: "LOGIN", payload: user });
        return { success: true };
      }

      const doctor = state.doctors.find(
        (d) => d.user_id === userId && d.password === password
      );

      if (portal === "doctor" && doctor) {
        const user: User = {
          user_id: userId,
          role: "doctor",
          doctor_id: doctor.doctor_id,
          doctor_name: doctor.doctor_name,
          doctor_speciality: doctor.doctor_speciality,
        };
        dispatch({ type: "LOGIN", payload: user });
        return { success: true };
      }

      return { success: false, error: "Invalid credentials" };
    },
    [state.doctors]
  );

  const logout = () => dispatch({ type: "LOGOUT" });

  /* ---------- Utils ---------- */

  const generatePatientId = () =>
    `PAT${String(state.patients.length + 1).padStart(5, "0")}`;

  const generateDoctorId = () =>
    `DOC${String(state.doctors.length + 1).padStart(3, "0")}`;

  const generateVisitId = () =>
    `VIS${String(state.visits.length + 1).padStart(5, "0")}`;

  const generatePrescriptionId = () =>
    `PRE${String(state.prescriptions.length + 1).padStart(5, "0")}`;

  const isDoctorUserIdUnique = (userId: string) =>
    !state.doctors.some((d) => d.user_id === userId);

  /* ---------- Provider ---------- */

  return (
    <HospitalContext.Provider
      value={{
        state,
        addPatient,
        deletePatient,
        addDoctor,
        deleteDoctor,
        addVisit,
        deleteVisit,
        addPrescription,
        deletePrescription,
        login,
        logout,
        generatePatientId,
        generateDoctorId,
        generateVisitId,
        generatePrescriptionId,
        isDoctorUserIdUnique,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
}
