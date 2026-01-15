import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  category: { type: String, required: true },
  type: { type: String, required: true },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    required: true,
  },
  notes: { type: String, default: "" },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ["Reported", "Responding", "Resolved"],
    default: "Reported",
  },
  assignedResources: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
  ],
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

/**
 * ✅ CRITICAL LINE
 * Prevents OverwriteModelError
 */
export default mongoose.models.Incident ||
  mongoose.model("Incident", incidentSchema);
