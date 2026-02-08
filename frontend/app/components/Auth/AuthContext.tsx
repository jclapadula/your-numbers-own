import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, type User } from "~/api/authApi";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresMfa: boolean;
  showMfaSetupModal: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissMfaSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [showMfaSetupModal, setShowMfaSetupModal] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });

      if (response.requiresMfa) {
        setRequiresMfa(true);
        setUser(null);
      } else {
        setUser(response);
        setRequiresMfa(false);
      }
    } catch (error) {
      setUser(null);
      setRequiresMfa(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async (code: string) => {
    setIsLoading(true);
    try {
      const user = await authApi.verifyMfaLogin(code);
      setUser(user);
      setRequiresMfa(false);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ email, password });
      setUser(response as User);

      if (response.showMfaSetup) {
        setShowMfaSetupModal(true);
      }
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setRequiresMfa(false);
      setShowMfaSetupModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissMfaSetup = () => {
    setShowMfaSetupModal(false);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    requiresMfa,
    showMfaSetupModal,
    login,
    verifyMfa,
    register,
    logout,
    dismissMfaSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
