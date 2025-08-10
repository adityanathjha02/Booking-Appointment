const express = require("express");
const Slot = require("../models/Slot");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Get available slots
router.get("/", auth, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: "MISSING_DATES",
          message: "From and to dates are required.",
        },
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate) || isNaN(toDate)) {
      return res.status(400).json({
        error: {
          code: "INVALID_DATES",
          message: "Invalid date format.",
        },
      });
    }

    const slots = await Slot.find({
      startAt: {
        $gte: fromDate,
        $lte: toDate,
      },
      isBooked: false,
    }).sort({ startAt: 1 });

    res.json(slots);
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({
      error: {
        code: "FETCH_SLOTS_ERROR",
        message: "Failed to fetch slots.",
      },
    });
  }
});

module.exports = router;
