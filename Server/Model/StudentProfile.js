
import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "github_repository",
        "assessment",
        "project",
        "manual"
      ],
      default: "manual"
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    url: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    repository: {
      type: String,
      trim: true
    },

    detectedSkills: [{
      type: String,
      trim: true
    }],

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    evidenceCount: {
      type: Number,
      min: 0,
      default: 0
    },

    evidence: {
      type: [evidenceSchema],
      default: []
    }
  },
  { _id: false }
);

const repositorySchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    language: String,
    stars: {
      type: Number,
      default: 0
    },
    description: String
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    skills: {
      type: [skillSchema],
      default: []
    },

    githubUsername: {
      type: String,
      trim: true
    },

    githubUrl: {
      type: String,
      trim: true
    },

    githubVerifiedAt: {
      type: Date,
      default: null
    },

    githubSummary: {
      publicRepos: {
        type: Number,
        default: 0
      },

      totalStars: {
        type: Number,
        default: 0
      },

      overallEvidenceScore: {
        type: Number,
        default: 0
      },

      repositories: {
        type: [repositorySchema],
        default: []
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "StudentProfile",
  studentProfileSchema
);
