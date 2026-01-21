const express = require("express");
const router = express.Router();
const Visit = require("../models/Visit");

// GET all visits
router.get("/", async (req, res) => {
  try {
    const visits = await Visit.find().sort({ visit_date: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visits" });
  }
});

// CREATE visit
router.post("/", async (req, res) => {
  try {
    const visit = await Visit.create(req.body);
    res.status(201).json({ message: "Visit created", visit });
  } catch (error) {
    res.status(500).json({ message: "Error creating visit", error: error.message });
  }
});

// BULK visits
router.post("/bulk", async (req, res) => {
  try {
    const visits = await Visit.insertMany(req.body, { ordered: false });
    res.status(201).json({ message: "Visits inserted", count: visits.length });
  } catch (error) {
    res.status(500).json({ message: "Bulk insert failed", error: error.message });
  }
});

// DELETE visit
router.delete("/:visitId", async (req, res) => {
  try {
    const visit = await Visit.findOneAndDelete({ visit_id: req.params.visitId });
    if (!visit) return res.status(404).json({ message: "Visit not found" });
    res.json({ message: "Visit deleted", visit });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;
