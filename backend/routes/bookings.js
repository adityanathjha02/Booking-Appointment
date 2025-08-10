const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const { auth, isAdmin, isPatient } = require("../middleware/auth");
const router = express.Router();

// Book appointment
router.post("/book", auth, isPatient, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { slotId } = req.body;

    if (!slotId) {
      await session.abortTransaction();
      return res.status(400).json({
        error: {
          code: "MISSING_SLOT_ID",
          message: "Slot ID is required.",
        },
      });
    }

    // Check if slot exists and is available
    const slot = await Slot.findById(slotId).session(session);
    if (!slot) {
      await session.abortTransaction();
      return res.status(400).json({
        error: {
          code: "SLOT_NOT_FOUND",
          message: "Slot not found.",
        },
      });
    }

    if (slot.isBooked) {
      await session.abortTransaction();
      return res.status(400).json({
        error: {
          code: "SLOT_TAKEN",
          message: "This slot is already booked.",
        },
      });
    }

    // Check if booking already exists
    const existingBooking = await Booking.findOne({ slot: slotId }).session(
      session
    );
    if (existingBooking) {
      await session.abortTransaction();
      return res.status(400).json({
        error: {
          code: "SLOT_TAKEN",
          message: "This slot is already booked.",
        },
      });
    }

    // Create booking and update slot
    const booking = new Booking({
      user: req.user._id,
      slot: slotId,
    });

    slot.isBooked = true;

    await booking.save({ session });
    await slot.save({ session });

    await session.commitTransaction();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "name email")
      .populate("slot", "startAt endAt");

    res.status(201).json({
      message: "Appointment booked successfully.",
      booking: populatedBooking,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: {
          code: "SLOT_TAKEN",
          message: "This slot is already booked.",
        },
      });
    }

    res.status(500).json({
      error: {
        code: "BOOKING_ERROR",
        message: "Failed to book appointment.",
      },
    });
  } finally {
    await session.endSession();
  }
});

// Get user's bookings
router.get("/my-bookings", auth, isPatient, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("slot", "startAt endAt")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      error: {
        code: "FETCH_BOOKINGS_ERROR",
        message: "Failed to fetch your bookings.",
      },
    });
  }
});

// Get all bookings (Admin only)
router.get("/all-bookings", auth, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email role")
      .populate("slot", "startAt endAt")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      error: {
        code: "FETCH_ALL_BOOKINGS_ERROR",
        message: "Failed to fetch all bookings.",
      },
    });
  }
});

module.exports = router;
