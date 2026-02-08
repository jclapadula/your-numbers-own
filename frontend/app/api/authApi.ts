import { httpClient } from "./httpClient";

export interface User {
  id: string;
  email: string;
  timeZone: string;
  mfaEnabled: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export type LoginResponse =
  | {
      id: string;
      email: string;
      timeZone: string;
      mfaEnabled: boolean;
      requiresMfa?: boolean;
      message?: string;
    }
  | { requiresMfa: true; message: string };

type RegisterResponse = {
  id: string;
  email: string;
  timeZone: string;
  mfaEnabled: boolean;
  showMfaSetup: boolean;
};

export interface MfaSetupResponse {
  otpauthUrl: string;
  manualEntryKey: string;
}

export const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    httpClient.post("/auth/login", credentials),

  register: (userData: RegisterRequest): Promise<RegisterResponse> =>
    httpClient.post("/auth/register", userData),

  logout: (): Promise<{ message: string }> =>
    httpClient.post("/auth/logout", {}),

  getCurrentUser: (): Promise<User> => httpClient.get("/auth/me"),

  setupMfa: (): Promise<MfaSetupResponse> =>
    httpClient.post("/auth/mfa/setup", {}),

  verifyMfaSetup: (
    code: string,
  ): Promise<{ success: boolean; message: string }> =>
    httpClient.post("/auth/mfa/verify-setup", { code }),

  verifyMfaLogin: (code: string): Promise<User> =>
    httpClient.post("/auth/mfa/verify-login", { code }),

  disableMfa: (
    password: string,
  ): Promise<{ success: boolean; message: string }> =>
    httpClient.post("/auth/mfa/disable", { password }),
};
