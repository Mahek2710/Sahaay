import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import { getRequiredDomains } from "./utils/resourceRules.js";
import User from "./models/User.js";

dotenv.config();

/* -------------------- App & Server Setup -------------------- */
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.use(cors());
app.use(express.json());

/* -------------------- Routes -------------------- */
app.use("/api/users", userRoutes);

/* -------------------- MongoDB Connection -------------------- */
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sahaay";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err.message)
  );

/* -------------------- Schemas & Models -------------------- */
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
  assignedVolunteers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ],
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

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
});

const Incident =
  mongoose.models.Incident ||
  mongoose.model("Incident", incidentSchema);

const Resource =
  mongoose.models.Resource ||
  mongoose.model("Resource", resourceSchema);

/* -------------------- Incident Routes -------------------- */
app.post("/api/incidents", async (req, res) => {
  try {
    const incident = new Incident({
      ...req.body,
      status: "Reported",
      assignedResources: [],
      assignedVolunteers: [],
    });

    await incident.save();

    const requiredDomains = getRequiredDomains(incident);

    const availableResources = await Resource.find({
      status: "Available",
      domain: { $in: requiredDomains },
    }).limit(2);

    if (availableResources.length > 0) {
      const resourceIds = availableResources.map((r) => r._id);

      incident.assignedResources = resourceIds;
      incident.status = "Responding";
      await incident.save();

      await Resource.updateMany(
        { _id: { $in: resourceIds } },
        { status: "Deployed" }
      );

      availableResources.forEach((r) => {
        io.emit("resourceUpdated", {
          ...r.toObject(),
          status: "Deployed",
        });
      });
    }

    const populatedIncident = await Incident.findById(incident._id)
      .populate("assignedResources")
      .populate("assignedVolunteers");

    io.emit("incidentCreated", populatedIncident);
    res.status(201).json(populatedIncident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/incidents", async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate("assignedResources")
      .populate("assignedVolunteers")
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/incidents/:id", async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("assignedResources")
      .populate("assignedVolunteers");

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json(incident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- Assign Volunteer -------------------- */
app.patch("/api/incidents/:id/assign-volunteer", async (req, res) => {
  try {
    const { volunteerId } = req.body;

    const incident = await Incident.findById(req.params.id);
    const volunteer = await User.findById(volunteerId);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    if (!volunteer || volunteer.role !== "VOLUNTEER") {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    if (!volunteer.volunteer?.isAvailable) {
      return res.status(400).json({ error: "Volunteer not available" });
    }

    incident.assignedVolunteers.push(volunteer._id);
    incident.status = "Responding";

    volunteer.volunteer.isAvailable = false;

    await volunteer.save();
    await incident.save();

    const updatedIncident = await Incident.findById(incident._id)
      .populate("assignedResources")
      .populate("assignedVolunteers");

    res.json(updatedIncident);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- Resource Routes -------------------- */
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/resources", async (req, res) => {
  try {
    const resource = new Resource(req.body);
    await resource.save();

    io.emit("resourceUpdated", resource);
    res.status(201).json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- Recommendations -------------------- */
app.post("/api/incidents/:id/recommend-resources", async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const requiredDomains = getRequiredDomains(incident);

    const availableResources = await Resource.find({
      status: "Available",
      domain: { $in: requiredDomains },
    });

    res.json({
      requiredDomains,
      recommendedResources: availableResources,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- Socket.io -------------------- */
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* -------------------- Server Start -------------------- */
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
