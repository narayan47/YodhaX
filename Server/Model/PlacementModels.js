
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const placementStudentSchema = new Schema(
  {
    // Optional link to an existing VerifHire user.
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    student_number: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    graduation_year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const placementDriveSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["live", "closing", "closed"],
      default: "live",
    },
    close_date: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const placementApplicationSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "PlacementStudent",
      required: true,
    },
    drive_id: {
      type: Schema.Types.ObjectId,
      ref: "PlacementDrive",
      required: true,
    },
    status: { type: String, default: "applied" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

placementApplicationSchema.index(
  { student_id: 1, drive_id: 1 },
  { unique: true }
);

const placementApprovalSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "PlacementStudent",
      required: true,
    },
    request_type: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "update_requested"],
      default: "pending",
    },
    reviewed_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "submitted_at", updatedAt: "updated_at" } }
);

const placementOfferSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "PlacementStudent",
      required: true,
    },
    drive_id: {
      type: Schema.Types.ObjectId,
      ref: "PlacementDrive",
      required: true,
    },
    status: {
      type: String,
      enum: ["received", "accepted", "declined"],
      default: "received",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

placementOfferSchema.index(
  { student_id: 1, drive_id: 1 },
  { unique: true }
);

const placementFacultySchema = new Schema(
  {
    full_name: { type: String, required: true, trim: true },
    role: {
      type: String,
      default: "Faculty coordinator",
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const placementSupportSchema = new Schema(
  {
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, default: "open" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const placementSettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

export const PlacementStudent =
  models.PlacementStudent ||
  model("PlacementStudent", placementStudentSchema);

export const PlacementDrive =
  models.PlacementDrive ||
  model("PlacementDrive", placementDriveSchema);

export const PlacementApplication =
  models.PlacementApplication ||
  model("PlacementApplication", placementApplicationSchema);

export const PlacementApproval =
  models.PlacementApproval ||
  model("PlacementApproval", placementApprovalSchema);

export const PlacementOffer =
  models.PlacementOffer ||
  model("PlacementOffer", placementOfferSchema);

export const PlacementFaculty =
  models.PlacementFaculty ||
  model("PlacementFaculty", placementFacultySchema);

export const PlacementSupport =
  models.PlacementSupport ||
  model("PlacementSupport", placementSupportSchema);

export const PlacementSetting =
  models.PlacementSetting ||
  model("PlacementSetting", placementSettingSchema);
