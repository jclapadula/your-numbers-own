import type { Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthService } from "../../services/authService";
import { MfaService } from "../../services/mfaService";
import { authenticate } from "../middlewares";
import { getAuthenticatedUser } from "../utils";

const router = Router();

const mfaVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many MFA verification attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

router.post("/setup", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);

    const mfaSetup = MfaService.generateMfaSecret(user.email);

    req.session.pendingMfaSecret = mfaSetup.secret;

    res.json({
      otpauthUrl: mfaSetup.otpauthUrl,
      manualEntryKey: mfaSetup.manualEntryKey,
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    res.status(500).json({ error: "Failed to generate MFA setup" });
  }
});

router.post(
  "/verify-setup",
  mfaVerifyLimiter,
  async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { code } = req.body;

      if (!code || code.length !== 6) {
        res.status(400).json({ error: "Invalid verification code format" });
        return;
      }

      const pendingSecret = req.session.pendingMfaSecret;
      if (!pendingSecret) {
        res.status(400).json({ error: "No pending MFA setup found" });
        return;
      }

      const isValidCode = MfaService.verifyMfaCode(pendingSecret, code);

      if (!isValidCode) {
        res.status(400).json({ error: "Invalid verification code" });
        return;
      }

      await MfaService.enableMfa(user.id, pendingSecret);

      delete req.session.pendingMfaSecret;

      res.json({ success: true, message: "MFA enabled successfully" });
    } catch (error) {
      console.error("MFA verify-setup error:", error);
      res.status(500).json({ error: "Failed to enable MFA" });
    }
  },
);

router.post("/disable", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: "Password required to disable MFA" });
      return;
    }

    const validatedUser = await AuthService.validateUser({
      email: user.email,
      password,
    });

    if (!validatedUser) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    await MfaService.disableMfa(user.id);

    res.json({ success: true, message: "MFA disabled successfully" });
  } catch (error) {
    console.error("MFA disable error:", error);
    res.status(500).json({ error: "Failed to disable MFA" });
  }
});

export default router;
