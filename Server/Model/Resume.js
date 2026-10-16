
import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    fullName: {
      type: String,
      default: "",
      maxlength: 150
    },

    email: {
      type: String,
      default: "",
      maxlength: 254
    },

    phone: {
      type: String,
      default: "",
      maxlength: 40
    },

    location: {
      type: String,
      default: "",
      maxlength: 150
    },

    linkedinUrl: {
      type: String,
      default: "",
      maxlength: 500
    },

    linkedinNotes: {
      type: String,
      default: "",
      maxlength: 5000
    },

    githubUrl: {
      type: String,
      default: "",
      maxlength: 500
    },

    portfolioUrl: {
      type: String,
      default: "",
      maxlength: 500
    },

    summary: {
      type: String,
      default: "",
      maxlength: 3000
    },

    education: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    experience: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    projects: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    certifications: {
      type: [String],
      default: []
    },

    achievements: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

export default mongoose.model("Resume", resumeSchema);
