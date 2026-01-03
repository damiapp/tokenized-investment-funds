const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authorization token required",
        },
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Token not provided",
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["passwordHash"] },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token - user not found",
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token",
        },
      });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Token expired",
        },
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Authentication error",
      },
    });
  }
};

module.exports = authMiddleware;
