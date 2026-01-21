const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// CREATE user
router.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

// UPDATE user
router.put("/:userId", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { user_id: req.params.userId },
      req.body,
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
});

// DELETE user
router.delete("/:userId", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ user_id: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted", user });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;
