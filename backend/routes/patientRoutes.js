const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Patient schema
const PatientSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  blood_group: { type: String, required: true },
  phone_number: { type: String, required: true },
  email: { type: String },
  emergency_contact: { type: String },
  hospital_location: { type: String },
  bmi: { type: Number },
  smoker_status: { type: Boolean, default: false },
  alcohol_use: { type: Boolean, default: false },
  chronic_conditions: { type: [String], default: [] },
  registration_date: { type: String, required: true },
  insurance_type: { type: String }
});

// Patient model
const Patient = mongoose.model("Patient", PatientSchema);

// ✅ GET all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ registration_date: -1 });
    res.json(patients);
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ message: "Error fetching patients" });
  }
});

// ✅ POST single patient
router.post("/", async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json({ 
      message: "Patient saved successfully", 
      patient 
    });
  } catch (err) {
    console.error("Error saving patient:", err);
    res.status(500).json({ message: "Error saving patient" });
  }
});

// ✅ POST bulk patients
router.post("/bulk", async (req, res) => {
  try {
    console.log("📥 Patient bulk upload received:", req.body?.length || 0, "items");
    
    // Validate input
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: "Invalid data format or empty array" });
    }

    // Validate each patient has required fields
    for (let i = 0; i < req.body.length; i++) {
      const patient = req.body[i];
      if (!patient.patient_id || !patient.full_name || !patient.age) {
        return res.status(400).json({ 
          message: `Patient at index ${i} missing required fields`,
          patient
        });
      }
    }

    const patients = await Patient.insertMany(req.body, { ordered: false });
    console.log("✅ Saved", patients.length, "patients to MongoDB");
    
    res.status(201).json({
      message: `${patients.length} patients saved successfully`,
      count: patients.length,
      patients: patients
    });
  } catch (error) {
    console.error("❌ Bulk insert failed:", error.message);
    res.status(500).json({ 
      message: "Bulk insert failed",
      error: error.message 
    });
  }
});

// ✅ DELETE patient by patient_id
router.delete("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const deleted = await Patient.findOneAndDelete({
      patient_id: patientId.trim()
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    res.json({
      message: "Patient deleted successfully",
      patient: deleted
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      message: "Failed to delete patient",
      error: err.message
    });
  }
});

module.exports = router;