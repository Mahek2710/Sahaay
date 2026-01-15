import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    phone: { type: String, unique: true },
    role: {
      type: String,
      enum: ["CITIZEN", "COORDINATOR", "AGENCY", "VOLUNTEER", "DONOR"],
      required: true,
    },
    location: {
      lat: Number,
      lng: Number,
    },

    // 🔹 VOLUNTEER ONLY
    volunteer: {
      skills: [String],
      isAvailable: { type: Boolean, default: true },
    },

    // 🔹 DONOR ONLY
    donor: {
      donationTypes: [String], // food, clothes, money
      items: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model("User", userSchema);
