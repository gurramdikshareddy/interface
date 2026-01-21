const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    visit_id: {
      type: String,
      required: true,
      unique: true
    },

    visit_date: {
      type: String, // frontend sends string (YYYY-MM-DD)
      required: true
    },

    patient_id: {
      type: String,
      required: true
    },

    doctor_id: {
      type: String,
      required: true
    },

    severity_score: {
      type: Number,
      min: 0,
      max: 5,
      required: true
    },

    visit_type: {
      type: String,
      enum: ["OP", "IP", "ICU"],
      required: true
    },

    length_of_stay: {
      type: Number,
      default: 0
    },

    lab_result_glucose: {
      type: Number,
      default: 0
    },

    lab_result_bp: {
      type: String, // example: "120/80"
      default: "0/0"
    },

    previous_visit_gap_days: {
      type: Number,
      default: 0
    },

    visit_cost: {
      type: Number,
      default: 0
    },

    readmitted_30_days: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visit", visitSchema);
