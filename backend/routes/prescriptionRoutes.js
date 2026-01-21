const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");

// GET all prescriptions
router.get("/", async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ prescribed_date: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching prescriptions" });
  }
});

// CREATE prescription
router.post("/", async (req, res) => {
  try {
    const prescription = await Prescription.create(req.body);
    res.status(201).json({ message: "Prescription created", prescription });
  } catch (error) {
    res.status(500).json({ message: "Error creating prescription", error: error.message });
  }
});

// BULK prescriptions
router.post("/bulk", async (req, res) => {
  try {
    const prescriptions = await Prescription.insertMany(req.body, { ordered: false });
    res.status(201).json({ message: "Prescriptions inserted", count: prescriptions.length });
  } catch (error) {
    res.status(500).json({ message: "Bulk insert failed", error: error.message });
  }
});

// DELETE prescription
router.delete("/:prescriptionId", async (req, res) => {
  try {
    const prescription = await Prescription.findOneAndDelete({
      prescription_id: req.params.prescriptionId
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json({ message: "Prescription deleted", prescription });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;
