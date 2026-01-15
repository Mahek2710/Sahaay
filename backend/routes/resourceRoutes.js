const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");

// GET all resources
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE resource status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Resource.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
