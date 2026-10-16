
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    company: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      default: "India"
    },

    remote: {
      type: Boolean,
      default: false
    },

    source: {
      type: String,
      default: "Employer"
    },

    applyUrl: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    tags: {
      type: [String],
      default: []
    },

    requiredSkills: {
      type: [String],
      default: []
    },

    employmentType: {
      type: String,
      default: "Full-time"
    },

    postedAt: {
      type: Date,
      default: Date.now
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
