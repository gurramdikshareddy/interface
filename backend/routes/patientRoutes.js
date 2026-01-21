const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");

// GET all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ patient_id: 1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching patients", error: error.message });
  }
});

// GET patient by patient_id
router.get("/:patientId", async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: "Error fetching patient", error: error.message });
  }
});

// CREATE patient
router.post("/", async (req, res) => {
  try {
    const patientData = req.body;

    // Check if patient_id already exists
    const exists = await Patient.findOne({ patient_id: patientData.patient_id });
    if (exists) {
      return res.status(400).json({ message: "Patient ID already exists" });
    }

    const patient = await Patient.create(patientData);
    res.status(201).json({ message: "Patient created", patient });
  } catch (error) {
    res.status(500).json({ message: "Error creating patient", error: error.message });
  }
});

// UPDATE patient
router.put("/:patientId", async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { patient_id: req.params.patientId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient updated", patient });
  } catch (error) {
    res.status(500).json({ message: "Error updating patient", error: error.message });
  }
});

// DELETE patient
router.delete("/:patientId", async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({
      patient_id: req.params.patientId
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient deleted", patient });
  } catch (error) {
    res.status(500).json({ message: "Error deleting patient", error: error.message });
  }
});

// BULK CREATE patients
router.post("/bulk", async (req, res) => {
  try {
    const patients = req.body;
    
    if (!Array.isArray(patients)) {
      return res.status(400).json({ message: "Expected array of patients" });
    }

    const createdPatients = await Patient.insertMany(patients);
    res.status(201).json({ 
      message: "Patients created successfully", 
      count: createdPatients.length,
      patients: createdPatients 
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating patients", error: error.message });
  }
});

module.exports = router;
