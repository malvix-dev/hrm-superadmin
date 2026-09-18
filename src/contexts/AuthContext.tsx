import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiPost, getToken, setToken, clearToken, getStoredUser, setStoredUser } from "@/lib/api";

export interface SuperAdmin {
  email: string;
  role: "super_admin";
}

interface AuthContextType {
  admin: SuperAdmin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  admin: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser() as SuperAdmin | null;
    if (stored && getToken()) setAdmin(stored);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiPost<{ token: string; admin: SuperAdmin }>("/auth/login", { email, password });
    setToken(data.token);
    setStoredUser(data.admin);
    setAdmin(data.admin);
  };

  const logout = () => {
    clearToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
