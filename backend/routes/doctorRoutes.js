const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Doctor Schema (if not importing from models)
const DoctorSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true, unique: true },
  doctor_name: { type: String, required: true },
  user_id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  doctor_speciality: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Doctor Model
const Doctor = mongoose.model("Doctor", DoctorSchema);

// ✅ GET all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ doctor_id: 1 });
    res.json(doctors);
  } catch (error) {
    console.error("❌ Error fetching doctors:", error);
    res.status(500).json({ 
      message: "Error fetching doctors",
      error: error.message 
    });
  }
});

// ✅ GET doctor by ID
router.get("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      doctor_id: req.params.doctorId 
    });
    
    if (!doctor) {
      return res.status(404).json({ 
        message: "Doctor not found" 
      });
    }
    
    res.json(doctor);
  } catch (error) {
    console.error("❌ Error fetching doctor:", error);
    res.status(500).json({ 
      message: "Error fetching doctor",
      error: error.message 
    });
  }
});

// ✅ POST create new doctor
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.doctor_name || !req.body.user_id || !req.body.password || !req.body.doctor_speciality) {
      return res.status(400).json({ 
        message: "Missing required fields: doctor_name, user_id, password, doctor_speciality are required" 
      });
    }

    // Check if user_id already exists
    const existingDoctor = await Doctor.findOne({ user_id: req.body.user_id });
    if (existingDoctor) {
      return res.status(400).json({ 
        message: "User ID already exists. Please choose a different user ID." 
      });
    }

    // Find the last doctor to generate next ID
    const lastDoctor = await Doctor.findOne()
      .sort({ doctor_id: -1 })
      .lean();

    // Generate next doctor_id
    let nextDoctorId = "DOC001";
    if (lastDoctor && lastDoctor.doctor_id) {
      const lastNumber = parseInt(lastDoctor.doctor_id.replace("DOC", ""));
      const newNumber = lastNumber + 1;
      nextDoctorId = "DOC" + String(newNumber).padStart(3, "0");
    }

    // Create new doctor
    const doctor = new Doctor({
      doctor_id: nextDoctorId,
      doctor_name: req.body.doctor_name,
      user_id: req.body.user_id,
      password: req.body.password,
      doctor_speciality: req.body.doctor_speciality
    });

    await doctor.save();
    console.log("✅ Doctor created:", nextDoctorId);

    res.status(201).json({
      message: "Doctor created successfully",
      doctor: doctor
    });
  } catch (error) {
    console.error("❌ Error creating doctor:", error);
    res.status(500).json({ 
      message: "Error creating doctor",
      error: error.message 
    });
  }
});

// ✅ DELETE doctor by doctor_id
router.delete("/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    console.log("Deleting doctor with doctor_id:", doctorId);

    const deletedDoctor = await Doctor.findOneAndDelete({
      doctor_id: doctorId.trim()
    });

    if (!deletedDoctor) {
      return res.status(404).json({
        message: "Doctor not found",
        doctorId: doctorId
      });
    }

    res.json({
      message: "Doctor deleted successfully",
      doctor: deletedDoctor
    });
  } catch (error) {
    console.error("❌ Doctor delete error:", error);
    res.status(500).json({
      message: "Error deleting doctor",
      error: error.message,
      doctorId: req.params.doctorId
    });
  }
});

// ✅ UPDATE doctor
router.put("/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const updatedDoctor = await Doctor.findOneAndUpdate(
      { doctor_id: doctorId.trim() },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({
        message: "Doctor not found",
        doctorId: doctorId
      });
    }

    res.json({
      message: "Doctor updated successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error("❌ Doctor update error:", error);
    res.status(500).json({
      message: "Error updating doctor",
      error: error.message
    });
  }
});

// ✅ GET doctors by specialty
router.get("/specialty/:specialty", async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      doctor_speciality: req.params.specialty 
    }).sort({ doctor_name: 1 });
    
    res.json(doctors);
  } catch (error) {
    console.error("❌ Error fetching doctors by specialty:", error);
    res.status(500).json({ 
      message: "Error fetching doctors by specialty",
      error: error.message 
    });
  }
});

module.exports = router;