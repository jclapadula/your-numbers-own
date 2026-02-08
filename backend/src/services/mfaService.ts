import { generateSecret, generateURI, verify } from "otplib";
import { db } from "../db";

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  manualEntryKey: string;
}

export class MfaService {
  static generateMfaSecret(email: string): MfaSetupResponse {
    const secret = generateSecret();

    const otpauthUrl = generateURI({
      issuer: "Your Numbers",
      label: email,
      secret,
    });

    const manualEntryKey = secret.match(/.{1,4}/g)?.join(" ") || secret;

    return {
      secret,
      otpauthUrl,
      manualEntryKey,
    };
  }

  static async verifyMfaCode(secret: string, code: string) {
    return (await verify({ token: code, secret })).valid;
  }

  static async enableMfa(userId: string, secret: string): Promise<void> {
    await db
      .updateTable("users")
      .set({
        mfaSecret: secret,
        mfaEnabled: true,
      })
      .where("id", "=", userId)
      .execute();
  }

  static async disableMfa(userId: string): Promise<void> {
    await db
      .updateTable("users")
      .set({
        mfaSecret: null,
        mfaEnabled: false,
      })
      .where("id", "=", userId)
      .execute();
  }

  static async getUserMfaSecret(userId: string): Promise<string | null> {
    const user = await db
      .selectFrom("users")
      .select(["mfaSecret"])
      .where("id", "=", userId)
      .executeTakeFirst();

    return user?.mfaSecret || null;
  }

  static async checkUserMfaEnabled(userId: string): Promise<boolean> {
    const user = await db
      .selectFrom("users")
      .select(["mfaEnabled"])
      .where("id", "=", userId)
      .executeTakeFirst();

    return user?.mfaEnabled || false;
  }
}
