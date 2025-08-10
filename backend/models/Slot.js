const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

slotSchema.index({ startAt: 1 });
slotSchema.index({ isBooked: 1 });

module.exports = mongoose.model("Slot", slotSchema);
