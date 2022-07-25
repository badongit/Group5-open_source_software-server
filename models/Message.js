const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "conversations",
      required: [true, "conversation is required"],
    },
    subId: {
      type: String,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    text: {
      type: String,
      trim: true,
    },
    fileId: String,
    fileType: {
      type: String,
      enum: {
        values: ["image", "video", "normal"],
        message: "file type {VALUE} is not supported",
      },
    },
    type: {
      type: String,
      enum: {
        values: ["user", "system"],
        message: "type {VALUE} is not supported",
      },
      default: "user",
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("messages", MessageSchema);
