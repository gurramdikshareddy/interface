const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// User Schema
const UserSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ["admin", "doctor", "patient"], default: "patient" },
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
});

// User Model
const User = mongoose.model("User", UserSchema);

// ✅ GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ 
      message: "Error fetching users",
      error: error.message 
    });
  }
});

// ✅ GET user by ID
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ 
      user_id: req.params.userId 
    });
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ 
      message: "Error fetching user",
      error: error.message 
    });
  }
});

// ✅ POST create new user
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.user_id || !req.body.name || !req.body.email || !req.body.phone) {
      return res.status(400).json({ 
        message: "Missing required fields: user_id, name, email, phone are required" 
      });
    }

    // Check if user_id or email already exists
    const existingUser = await User.findOne({ 
      $or: [
        { user_id: req.body.user_id },
        { email: req.body.email }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "User ID or Email already exists" 
      });
    }

    // Create new user
    const user = new User({
      user_id: req.body.user_id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role || "patient",
      is_active: req.body.is_active !== undefined ? req.body.is_active : true
    });

    await user.save();
    console.log("✅ User created:", user.user_id);

    res.status(201).json({
      message: "User created successfully",
      user: user
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    res.status(500).json({ 
      message: "Error creating user",
      error: error.message 
    });
  }
});

// ✅ PUT update user
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Don't allow updating user_id
    if (req.body.user_id) {
      delete req.body.user_id;
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId.trim() },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        userId: userId
      });
    }

    res.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ User update error:", error);
    res.status(500).json({
      message: "Error updating user",
      error: error.message
    });
  }
});

// ✅ DELETE user by user_id
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log("Deleting user with user_id:", userId);

    const deletedUser = await User.findOneAndDelete({
      user_id: userId.trim()
    });

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
        userId: userId
      });
    }

    res.json({
      message: "User deleted successfully",
      user: deletedUser
    });
  } catch (error) {
    console.error("❌ User delete error:", error);
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
      userId: req.params.userId
    });
  }
});

// ✅ GET users by role
router.get("/role/:role", async (req, res) => {
  try {
    const users = await User.find({ 
      role: req.params.role,
      is_active: true 
    }).sort({ name: 1 });
    
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users by role:", error);
    res.status(500).json({ 
      message: "Error fetching users by role",
      error: error.message 
    });
  }
});

module.exports = router;