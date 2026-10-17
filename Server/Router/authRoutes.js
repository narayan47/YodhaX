import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import User from "../Model/User.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
});



function createVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return { rawToken, hashedToken };
}

function createJwt(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
}

function setAuthCookie(res, user) {
  res.cookie("token", createJwt(user), cookieOptions());
}

function clearAuthCookie(res) {
  const options = cookieOptions();

  res.clearCookie("token", {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}

/* ---------------- SIGNUP ---------------- */

router.post("/signup", authLimiter, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "student",
    } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanName.length < 2 ||
      cleanName.length > 80
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    if (
      !["student", "recruiter", "placementcell"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid account role.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const existing = await User.findOne({
      email: cleanEmail,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.isEmailVerified
          ? "An account with this email already exists."
          : "An account exists but is not verified. Request a new verification email.",
        code: existing.isEmailVerified
          ? "EMAIL_EXISTS"
          : "EMAIL_UNVERIFIED",
      });
    }

    const { rawToken, hashedToken } =
      createVerificationToken();

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: await bcrypt.hash(password, 12),
      role,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(
        Date.now() + 15 * 60 * 1000
      ),
    });

    try {
      await sendVerificationEmail(user.email, rawToken);
    } catch (emailError) {
      await User.deleteOne({ _id: user._id });

      console.error(
        "Verification email failed:",
        emailError.message
      );

      return res.status(502).json({
        success: false,
        message:
          "We could not send the verification email. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Account created. Check your email to verify your account.",
      requiresEmailVerification: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create your account.",
    });
  }
});

/* ---------------- VERIFY EMAIL ---------------- */

router.post(
  "/verify-email",
  verificationLimiter,
  async (req, res) => {
    try {
      const { token } = req.body || {};

      if (typeof token !== "string" || !token) {
        return res.status(400).json({
          success: false,
          message: "Verification token is missing.",
        });
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
        isEmailVerified: false,
      }).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "This verification link is invalid, expired, or already used.",
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "Email verified successfully. You can now log in.",
      });
    } catch (error) {
      console.error(
        "Email verification error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Unable to verify your email.",
      });
    }
  }
);

/* ---------------- RESEND VERIFICATION ---------------- */

router.post(
  "/resend-verification",
  verificationLimiter,
  async (req, res) => {
    try {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }

      const generic = {
        success: true,
        message:
          "If an unverified account exists, a verification email will be sent.",
      };

      const user = await User.findOne({ email }).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

      if (!user || user.isEmailVerified) {
        return res.status(200).json(generic);
      }

      const { rawToken, hashedToken } =
        createVerificationToken();

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(
        Date.now() + 15 * 60 * 1000
      );

      await user.save();

      try {
        await sendVerificationEmail(user.email, rawToken);
      } catch (error) {
        console.error(
          "Resend email failed:",
          error.message
        );

        return res.status(502).json({
          success: false,
          message:
            "Unable to send email right now. Please try later.",
        });
      }

      return res.status(200).json(generic);
    } catch (error) {
      console.error(
        "Resend verification error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Unable to process your request.",
      });
    }
  }
);

/* ---------------- LOGIN ---------------- */

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_UNVERIFIED",
        message: "Please verify your email before logging in.",
      });
    }

    setAuthCookie(res, user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in right now.",
    });
  }
});

/* ---------------- CURRENT USER ---------------- */

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isEmailVerified) {
      clearAuthCookie(res);

      return res.status(401).json({
        success: false,
        message: "Please log in again.",
      });
    }

    return res.status(200).json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Current user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your account.",
    });
  }
});

/* ---------------- LOGOUT ---------------- */

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

export default router;