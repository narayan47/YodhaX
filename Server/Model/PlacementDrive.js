
import mongoose from "mongoose";

const placementDriveSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "Not specified",
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Internship", "Contract", "Part-time"],
      default: "Full-time",
    },
    packageLpa: {
      type: Number,
      min: 0,
      default: 0,
    },
    eligibleCourses: [{
      type: String,
      trim: true,
    }],
    minCgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    eligibleGraduationYears: [{
      type: Number,
    }],
    deadline: {
      type: Date,
      required: true,
    },
    driveDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Draft", "Open", "Closed", "Completed"],
      default: "Open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applications: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: [
          "Applied",
          "Shortlisted",
          "Rejected",
          "Selected",
          "Withdrawn",
        ],
        default: "Applied",
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

placementDriveSchema.index({ status: 1, deadline: 1 });

export default mongoose.models.PlacementDrive ||
  mongoose.model("PlacementDrive", placementDriveSchema);
