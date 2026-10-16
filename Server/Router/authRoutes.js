
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
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
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
  const token = createJwt(user);

  res.cookie("token", token, cookieOptions());
}

/* ---------------- SIGNUP ---------------- */

router.post("/signup", authLimiter, async (req, res) => {
  try {
    const { name, email, password, role = "student" } = req.body;

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

    if (cleanName.length < 2 || cleanName.length > 80) {
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

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters.",
      });
    }

    if (!["student", "recruiter", "placementcell"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid account role.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.isEmailVerified
          ? "An account with this email already exists."
          : "An account exists but is not verified. Request a new verification email.",
        code: existingUser.isEmailVerified
          ? "EMAIL_EXISTS"
          : "EMAIL_UNVERIFIED",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rawToken, hashedToken } = createVerificationToken();

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    try {
      await sendVerificationEmail(user.email, rawToken);
    } catch (emailError) {
      // Do not leave an unusable account if email delivery fails.
      await User.deleteOne({ _id: user._id });

      console.error("Verification email failed:", emailError.message);
      console.error("Error code:", emailError.code);
  console.error("SMTP response:", emailError.response);


      return res.status(502).json({
        success: false,
        message: "We could not send the verification email. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created. Check your email to verify your account.",
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
      const { token } = req.body;

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
      }).select("+emailVerificationToken +emailVerificationExpires");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "This verification link is invalid, expired, or already used.",
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email verified successfully. You can now log in.",
      });
    } catch (error) {
      console.error("Email verification error:", error.message);

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
        typeof req.body.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }

      const user = await User.findOne({ email }).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

      // Avoid revealing whether an email belongs to an account.
      const genericResponse = {
        success: true,
        message:
          "If an unverified account exists, a verification email will be sent.",
      };

      if (!user || user.isEmailVerified) {
        return res.status(200).json(genericResponse);
      }

      const { rawToken, hashedToken } = createVerificationToken();

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(
        Date.now() + 15 * 60 * 1000
      );

      await user.save();

      try {
        await sendVerificationEmail(user.email, rawToken);
      } catch (error) {
        console.error("Resend email failed:", error.message);

        return res.status(502).json({
          success: false,
          message: "Unable to send email right now. Please try later.",
        });
      }

      return res.status(200).json(genericResponse);
    } catch (error) {
      console.error("Resend verification error:", error.message);

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
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
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
      res.clearCookie("token", cookieOptions());

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

router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions());

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

export default router;
