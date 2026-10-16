import jwt from "jsonwebtoken";

function readToken(req) {
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  const authorization = req.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return null;
}

export function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(503).json({
      success: false,
      message: "Authentication is not configured.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const id = decoded.sub || decoded.id || decoded._id;

    if (!id) {
      throw new Error("Token has no subject.");
    }

    req.user = {
      _id: id,
      id,
      role: decoded.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session is invalid or has expired.",
    });
  }
}

export const protect = requireAuth;

export function requireRole(...roles) {
  return (req, res, next) => {
    if (
      !req.user ||
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this resource.",
      });
    }

    return next();
  };
}

export const allowRoles = requireRole;