import express from "express";
import User from "../models/User.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = express.Router();

/* ---------------- CREATE USER ---------------- */
/* Anyone can register (Citizen / Volunteer / Donor) */
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------------- GET ALL USERS ---------------- */
/* ONLY coordinators & agencies */
router.get(
  "/",
  requirePermission("VIEW_USERS"),
  async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ---------------- GET USERS BY ROLE ---------------- */
/* ONLY coordinators & agencies */
router.get(
  "/role/:role",
  requirePermission("VIEW_USERS"),
  async (req, res) => {
    try {
      const users = await User.find({ role: req.params.role });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ---------------- VOLUNTEER: UPDATE AVAILABILITY ---------------- */
/* ONLY coordinators & agencies */
router.patch(
  "/volunteer/availability",
  requirePermission("UPDATE_VOLUNTEER_STATUS"),
  async (req, res) => {
    try {
      const { userId, isAvailable } = req.body;

      if (!userId || typeof isAvailable !== "boolean") {
        return res.status(400).json({
          error: "userId and isAvailable (boolean) are required",
        });
      }

      const user = await User.findById(userId);

      if (!user || user.role !== "VOLUNTEER") {
        return res.status(404).json({ error: "Volunteer not found" });
      }

      user.volunteer.isAvailable = isAvailable;
      await user.save();

      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
