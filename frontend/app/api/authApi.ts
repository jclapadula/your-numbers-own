import { httpClient } from "./httpClient";

export interface User {
  id: string;
  email: string;
  timeZone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export const authApi = {
  login: (credentials: LoginRequest): Promise<User> =>
    httpClient.post("/auth/login", credentials),

  register: (userData: RegisterRequest): Promise<User> =>
    httpClient.post("/auth/register", userData),

  logout: (): Promise<{ message: string }> =>
    httpClient.post("/auth/logout", {}),

  getCurrentUser: (): Promise<User> =>
    httpClient.get("/auth/me"),
};