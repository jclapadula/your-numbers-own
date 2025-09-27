import bcrypt from "bcryptjs";
import { db } from "../db";
import type { Users } from "../db/models";

export type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async createUser({ email, password }: CreateUserRequest): Promise<UserRow> {
    const existingUser = await db
      .selectFrom("users")
      .where("email", "=", email.toLowerCase())
      .selectAll()
      .executeTakeFirst();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const passwordHash = await this.hashPassword(password);

    const user = await db
      .insertInto("users")
      .values({
        email: email.toLowerCase(),
        passwordHash,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return user;
  }

  static async validateUser({ email, password }: LoginRequest): Promise<UserRow | null> {
    const user = await db
      .selectFrom("users")
      .where("email", "=", email.toLowerCase())
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      return null;
    }

    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  static async getUserById(id: string): Promise<UserRow | null> {
    const user = await db
      .selectFrom("users")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    return user || null;
  }
}