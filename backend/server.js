console.log("SERVER FILE STARTED");

const express = require("express");
const cors = require("cors");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const connectDB = require("./db");
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend-name.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/visits", require("./routes/visitRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/prescriptions", require("./routes/prescriptionRoutes"));

app.get("/", (req, res) => {
  res.json({ status: "API running" });
});

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
