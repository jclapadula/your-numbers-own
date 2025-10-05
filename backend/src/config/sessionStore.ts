import { Store } from "express-session";
import { db } from "../db";

interface SessionData {
  cookie: {
    originalMaxAge: number;
    expires: Date;
    secure: boolean;
    httpOnly: boolean;
  };
  passport?: {
    user: string;
  };
  [key: string]: any;
}

const ONE_HOUR = 60 * 60 * 1000;

export class PostgresSessionStore extends Store {
  constructor() {
    super();

    // Set up cleanup interval for expired sessions (every hour)
    setInterval(() => {
      this.cleanup();
    }, ONE_HOUR);
  }

  async get(
    sid: string,
    callback: (err?: any, session?: SessionData | null) => void
  ) {
    try {
      const result = await db
        .selectFrom("sessions")
        .select("sess")
        .where("sid", "=", sid)
        .where("expire", ">", new Date())
        .executeTakeFirst();

      if (!result) {
        return callback(null, null);
      }

      const session =
        typeof result.sess === "string" ? JSON.parse(result.sess) : result.sess;

      callback(null, session);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, session: SessionData, callback?: (err?: any) => void) {
    try {
      const expire =
        session.cookie?.expires || new Date(Date.now() + 24 * 60 * 60 * 1000);
      const sessJson = JSON.stringify(session);

      await db
        .insertInto("sessions")
        .values({
          sid,
          sess: sessJson,
          expire,
        })
        .onConflict((oc) =>
          oc.column("sid").doUpdateSet({
            sess: sessJson,
            expire,
          })
        )
        .execute();

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await db.deleteFrom("sessions").where("sid", "=", sid).execute();

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(
    sid: string,
    session: SessionData,
    callback?: (err?: any) => void
  ) {
    try {
      const expire =
        session.cookie?.expires || new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db
        .updateTable("sessions")
        .set({ expire })
        .where("sid", "=", sid)
        .execute();

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async cleanup() {
    try {
      const result = await db
        .deleteFrom("sessions")
        .where("expire", "<", new Date())
        .execute();

      console.log(`Cleaned up ${result.length} expired sessions`);
    } catch (error) {
      console.error("Session cleanup error:", error);
    }
  }
}
