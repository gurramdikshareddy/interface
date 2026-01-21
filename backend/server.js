// server.js
console.log("SERVER FILE STARTED");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");

const app = express();

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Connect to MongoDB
connectDB().catch(err => console.error(err));

// ✅ IMPORTANT: Import all your routes
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const visitRoutes = require("./routes/visitRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

// ✅ USE the routes
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "Hospital Management API",
    status: "running",
    database: "MongoDB Atlas",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get("/api/health", (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "healthy",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found: " + req.url });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

// For Vercel
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;