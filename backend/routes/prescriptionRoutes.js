const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Prescription Schema (if not importing from models)
const PrescriptionSchema = new mongoose.Schema({
  prescription_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  doctor_id: { type: String, required: true },
  visit_id: { type: String, required: true },
  prescribed_date: { type: String, required: true },
  medication_name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration_days: { type: Number, required: true },
  instructions: { type: String },
  prescription_cost: { type: Number, default: 0 }
});

// Prescription Model
const Prescription = mongoose.model("Prescription", PrescriptionSchema);

// ✅ GET all prescriptions
router.get("/", async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ prescribed_date: -1 });
    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Error fetching prescriptions:", err);
    res.status(500).json({ 
      message: "Error fetching prescriptions",
      error: err.message 
    });
  }
});

// ✅ GET prescription by ID
router.get("/:prescriptionId", async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ 
      prescription_id: req.params.prescriptionId 
    });
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    
    res.json(prescription);
  } catch (err) {
    console.error("❌ Error fetching prescription:", err);
    res.status(500).json({ 
      message: "Error fetching prescription",
      error: err.message 
    });
  }
});

// ✅ POST single prescription
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['prescription_id', 'patient_id', 'doctor_id', 'visit_id', 'medication_name'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ 
          message: `Missing required field: ${field}` 
        });
      }
    }

    const prescription = new Prescription(req.body);
    await prescription.save();
    
    res.status(201).json({ 
      message: "Prescription saved successfully", 
      prescription 
    });
  } catch (err) {
    console.error("❌ Error saving prescription:", err);
    res.status(500).json({ 
      message: "Error saving prescription",
      error: err.message 
    });
  }
});

// ✅ POST bulk prescriptions
router.post("/bulk", async (req, res) => {
  try {
    console.log("📥 Prescription bulk upload received:", req.body?.length || 0, "items");
    
    // Validate input
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ 
        message: "Invalid data format or empty array" 
      });
    }

    // Validate each prescription has required fields
    const requiredFields = ['prescription_id', 'patient_id', 'doctor_id', 'medication_name'];
    for (let i = 0; i < req.body.length; i++) {
      const prescription = req.body[i];
      for (const field of requiredFields) {
        if (!prescription[field]) {
          return res.status(400).json({ 
            message: `Prescription at index ${i} missing required field: ${field}`,
            prescription
          });
        }
      }
    }

    const prescriptions = await Prescription.insertMany(req.body, { ordered: false });
    console.log("✅ Saved", prescriptions.length, "prescriptions to MongoDB");
    
    res.status(201).json({
      message: `${prescriptions.length} prescriptions saved successfully`,
      count: prescriptions.length,
      prescriptions: prescriptions
    });
  } catch (error) {
    console.error("❌ Prescription bulk insert failed:", error.message);
    
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate prescription_id found. Prescription IDs must be unique.",
        error: error.message
      });
    }
    
    res.status(500).json({ 
      message: "Bulk insert failed",
      error: error.message 
    });
  }
});

// ✅ DELETE prescription by prescription_id
router.delete("/:prescriptionId", async (req, res) => {
  try {
    let { prescriptionId } = req.params;
    prescriptionId = prescriptionId.trim();

    console.log("Deleting prescription:", prescriptionId);

    const deletedPrescription = await Prescription.findOneAndDelete({
      prescription_id: prescriptionId
    });

    if (!deletedPrescription) {
      return res.status(404).json({
        message: "Prescription not found",
        prescriptionId: prescriptionId
      });
    }

    res.json({
      message: "Prescription deleted successfully",
      prescription: deletedPrescription
    });
  } catch (error) {
    console.error("❌ Prescription delete error:", error);
    res.status(500).json({
      message: "Error deleting prescription",
      error: error.message,
      prescriptionId: req.params.prescriptionId
    });
  }
});

// ✅ GET prescriptions by patient_id
router.get("/patient/:patientId", async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ 
      patient_id: req.params.patientId 
    }).sort({ prescribed_date: -1 });
    
    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Error fetching patient prescriptions:", err);
    res.status(500).json({ 
      message: "Error fetching patient prescriptions",
      error: err.message 
    });
  }
});

// ✅ GET prescriptions by doctor_id
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ 
      doctor_id: req.params.doctorId 
    }).sort({ prescribed_date: -1 });
    
    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Error fetching doctor prescriptions:", err);
    res.status(500).json({ 
      message: "Error fetching doctor prescriptions",
      error: err.message 
    });
  }
});

module.exports = router;