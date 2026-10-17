
import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: [
        "applied",
        "shortlisted",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
    },
    to: {
      type: String,
      enum: [
        "applied",
        "shortlisted",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedByRole: {
      type: String,
      enum: ["student", "placementcell"],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    applyUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2048,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "applied",
        "shortlisted",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
      index: true,
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ student: 1, createdAt: -1 });
applicationSchema.index({ status: 1, createdAt: -1 });

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

export default Application;
