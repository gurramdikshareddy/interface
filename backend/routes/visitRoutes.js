const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Visit Schema
const VisitSchema = new mongoose.Schema({
  visit_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  doctor_id: { type: String, required: true },
  visit_date: { type: String, required: true },
  severity_score: { type: Number, min: 0, max: 5, default: 0 },
  visit_type: { type: String, enum: ["OP", "IP"], default: "OP" },
  length_of_stay: { type: Number, default: 0 },
  lab_result_glucose: { type: Number, default: 0 },
  lab_result_bp: { type: String, default: "120/80" },
  previous_visit_gap_days: { type: Number, default: 0 },
  readmitted_within_30_days: { type: Boolean, default: false },
  visit_cost: { type: Number, required: true, default: 0 }
});

// Visit Model
const Visit = mongoose.model("Visit", VisitSchema);

// ✅ GET all visits
router.get("/", async (req, res) => {
  try {
    const visits = await Visit.find().sort({ visit_date: -1 });
    res.json(visits);
  } catch (err) {
    console.error("Error fetching visits:", err);
    res.status(500).json({ message: "Error fetching visits" });
  }
});

// ✅ GET visit by ID
router.get("/:visitId", async (req, res) => {
  try {
    const visit = await Visit.findOne({ visit_id: req.params.visitId });
    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }
    res.json(visit);
  } catch (err) {
    console.error("Error fetching visit:", err);
    res.status(500).json({ message: "Error fetching visit" });
  }
});

// ✅ POST single visit
router.post("/", async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    res.status(201).json({ 
      message: "Visit saved successfully", 
      visit 
    });
  } catch (err) {
    console.error("Error saving visit:", err);
    res.status(500).json({ message: "Error saving visit" });
  }
});

// ✅ POST bulk visits
router.post("/bulk", async (req, res) => {
  try {
    console.log("📥 Visit bulk upload received:", req.body?.length || 0, "items");
    
    // Validate input
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: "Invalid data format or empty array" });
    }

    // Validate each visit has required fields
    for (let i = 0; i < req.body.length; i++) {
      const visit = req.body[i];
      if (!visit.visit_id || !visit.patient_id || !visit.doctor_id || !visit.visit_date) {
        return res.status(400).json({ 
          message: `Visit at index ${i} missing required fields`,
          visit
        });
      }
    }

    const visits = await Visit.insertMany(req.body, { ordered: false });
    console.log("✅ Saved", visits.length, "visits to MongoDB");
    
    res.status(201).json({
      message: `${visits.length} visits saved successfully`,
      count: visits.length,
      visits: visits
    });
  } catch (error) {
    console.error("❌ Visit bulk insert failed:", error.message);
    res.status(500).json({ 
      message: "Bulk insert failed",
      error: error.message 
    });
  }
});

// ✅ DELETE visit by visit_id
router.delete("/:visitId", async (req, res) => {
  try {
    const { visitId } = req.params;
    const deletedVisit = await Visit.findOneAndDelete({
      visit_id: visitId.trim()
    });

    if (!deletedVisit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    res.json({ 
      message: "Visit deleted successfully",
      visit: deletedVisit 
    });
  } catch (error) {
    console.error("Visit delete error:", error);
    res.status(500).json({ 
      message: "Error deleting visit",
      error: error.message 
    });
  }
});

module.exports = router;