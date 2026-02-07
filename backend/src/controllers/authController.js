const { User, KycStatus } = require("../models");
const { generateToken } = require("../services/jwt");
const { hashPassword, comparePassword } = require("../services/password");

const authController = {
  async register(req, res) {
    try {
      const { email, password, role, walletAddress } = req.body;

      if (!email || !password || !role) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Email, password, and role are required",
          },
        });
      }

      if (!["GP", "LP"].includes(role)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Role must be either 'GP' or 'LP'",
          },
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Password must be at least 8 characters long",
          },
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: "EMAIL_EXISTS",
            message: "Email already registered",
          },
        });
      }

      if (walletAddress) {
        const walletRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!walletRegex.test(walletAddress)) {
          return res.status(400).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid wallet address format",
            },
          });
        }
      }

      const passwordHash = await hashPassword(password);
      const user = await User.create({
        email,
        passwordHash,
        role,
        walletAddress: walletAddress || null,
      });

      const kycStatus = await KycStatus.create({
        userId: user.id,
        status: "pending",
      });

      const token = generateToken(user.id);

      const userResponse = {
        id: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        kyc: {
          status: kycStatus.status,
          updatedAt: kycStatus.updatedAt,
        },
      };

      res.status(201).json({
        data: {
          user: userResponse,
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Registration failed",
        },
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and password are required",
          },
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        });
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        });
      }

      const token = generateToken(user.id);

      const kycStatus = await KycStatus.findOne({
        where: { userId: user.id },
        attributes: ["status", "updatedAt"],
      });

      const userResponse = {
        id: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        kyc: kycStatus || { status: "pending", updatedAt: new Date() },
      };

      res.status(200).json({
        data: {
          token,
          user: userResponse,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Login failed",
        },
      });
    }
  },

  async getCurrentUser(req, res) {
    try {
      const user = req.user;
      
      const kycStatus = await KycStatus.findOne({
        where: { userId: user.id },
        attributes: ["status", "updatedAt"],
      });

      const userResponse = {
        id: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        kyc: kycStatus || { status: "pending", updatedAt: new Date() },
      };

      res.status(200).json({
        data: userResponse,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get user information",
        },
      });
    }
  },

  async updateWalletAddress(req, res) {
    try {
      const { walletAddress } = req.body;
      const user = req.user;

      if (!walletAddress) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Wallet address is required",
          },
        });
      }

      const walletRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!walletRegex.test(walletAddress)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid wallet address format",
          },
        });
      }

      await user.update({ walletAddress });

      res.status(200).json({
        data: {
          message: "Wallet address updated successfully",
          walletAddress,
        },
      });
    } catch (error) {
      console.error("Update wallet address error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update wallet address",
        },
      });
    }
  },
};

module.exports = authController;
