import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  capability: { type: String, required: true },
  status: {
    type: String,
    enum: ["Available", "Deployed", "Unavailable"],
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

});

export default mongoose.models.Resource ||
  mongoose.model("Resource", resourceSchema);
