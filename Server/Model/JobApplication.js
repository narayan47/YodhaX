import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const statusHistorySchema = new Schema(
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
      required: true,
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedByRole: {
      type: String,
      enum: ["student", "placementcell"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const jobApplicationSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshot fields: these work for external jobs too.
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
      maxlength: 2000,
    },

    source: {
      type: String,
      enum: ["external", "verifhire"],
      default: "external",
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

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

jobApplicationSchema.index({
  student: 1,
  status: 1,
  updatedAt: -1,
});

const JobApplication =
  models.JobApplication ||
  model("JobApplication", jobApplicationSchema);

export default JobApplication;