const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

// GET all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ doctor_id: 1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
});

// GET doctor by doctor_id
router.get("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctor_id: req.params.doctorId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor", error: error.message });
  }
});

// CREATE doctor
router.post("/", async (req, res) => {
  try {
    const { doctor_name, user_id, password, doctor_speciality } = req.body;

    if (!doctor_name || !user_id || !password || !doctor_speciality) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await Doctor.findOne({ user_id });
    if (exists) {
      return res.status(400).json({ message: "User ID already exists" });
    }

    const lastDoctor = await Doctor.findOne().sort({ doctor_id: -1 });
    let nextId = "DOC001";

    if (lastDoctor?.doctor_id) {
      const num = parseInt(lastDoctor.doctor_id.replace("DOC", "")) + 1;
      nextId = "DOC" + String(num).padStart(3, "0");
    }

    const doctor = await Doctor.create({
      doctor_id: nextId,
      doctor_name,
      user_id,
      password,
      doctor_speciality
    });

    res.status(201).json({ message: "Doctor created", doctor });
  } catch (error) {
    res.status(500).json({ message: "Error creating doctor", error: error.message });
  }
});

// UPDATE doctor
router.put("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { doctor_id: req.params.doctorId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor updated", doctor });
  } catch (error) {
    res.status(500).json({ message: "Error updating doctor", error: error.message });
  }
});

// DELETE doctor
router.delete("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndDelete({
      doctor_id: req.params.doctorId
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor deleted", doctor });
  } catch (error) {
    res.status(500).json({ message: "Error deleting doctor", error: error.message });
  }
});

module.exports = router;
