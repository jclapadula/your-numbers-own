import type { Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import passport from "../../config/passport";
import { AuthService } from "../../services/authService";
import { MfaService } from "../../services/mfaService";

const router = Router();

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Register endpoint
router.post("/register", rateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (password.length < 8) {
      res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
      return;
    }

    const user = await AuthService.createUser({ email, password });

    // Automatically log in the user after registration
    req.login(user, (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to log in after registration" });
        return;
      }

      res.status(201).json({
        id: user.id,
        email: user.email,
        timeZone: user.timeZone,
        mfaEnabled: false,
        showMfaSetup: true,
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User with this email already exists"
    ) {
      res.status(409).json({ error: error.message });
      return;
    }

    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login endpoint
router.post("/login", rateLimiter, (req: Request, res: Response, next) => {
  passport.authenticate("local", async (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res
        .status(401)
        .json({ error: info?.message || "Invalid credentials" });
    }

    const mfaEnabled = await MfaService.checkUserMfaEnabled(user.id);

    if (mfaEnabled) {
      req.session.pendingMfaUserId = user.id;

      return res.json({
        requiresMfa: true,
        message: "MFA verification required",
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      res.json({
        id: user.id,
        email: user.email,
        timeZone: user.timeZone,
        mfaEnabled: false,
      });
    });
  })(req, res, next);
});

// MFA verify-login endpoint
router.post(
  "/mfa/verify-login",
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      if (!code || code.length !== 6) {
        res.status(400).json({ error: "Invalid verification code format" });
        return;
      }

      const pendingUserId = req.session.pendingMfaUserId;
      if (!pendingUserId) {
        res.status(400).json({ error: "No pending MFA verification" });
        return;
      }

      const mfaSecret = await MfaService.getUserMfaSecret(pendingUserId);
      if (!mfaSecret) {
        res.status(500).json({ error: "MFA configuration error" });
        return;
      }

      const isValidCode = MfaService.verifyMfaCode(mfaSecret, code);

      if (!isValidCode) {
        res.status(401).json({ error: "Invalid verification code" });
        return;
      }

      const user = await AuthService.getUserById(pendingUserId);
      if (!user) {
        res.status(500).json({ error: "User not found" });
        return;
      }

      delete req.session.pendingMfaUserId;

      req.login(user, (err) => {
        if (err) {
          res.status(500).json({ error: "Failed to complete login" });
          return;
        }

        res.json({
          id: user.id,
          email: user.email,
          timeZone: user.timeZone,
          mfaEnabled: true,
        });
      });
    } catch (error) {
      console.error("MFA verify-login error:", error);
      res.status(500).json({ error: "Failed to verify MFA code" });
    }
  },
);

// Logout endpoint
router.post("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }

    res.json({ message: "Logged out successfully" });
  });
});

// Get current user
router.get("/me", (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = req.user as any;
  res.json({
    id: user.id,
    email: user.email,
    timeZone: user.timeZone,
    mfaEnabled: user.mfaEnabled || false,
  });
});

declare module "express-session" {
  interface SessionData {
    pendingMfaUserId?: string;
    pendingMfaSecret?: string;
  }
}

export default router;
