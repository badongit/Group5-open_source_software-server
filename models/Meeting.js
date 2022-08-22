const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MeetingSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "conversations",
      required: [true, "conversation is required"],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "creator is required"],
    },
    title: {
      type: String,
      trim: true,
      required: [true, "title is required"],
    },
    start: {
      type: Date,
      required: [true, "start is required"],
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("meetings", MeetingSchema);
