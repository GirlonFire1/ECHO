import { useState, useContext, createContext, useEffect } from 'react';
import { getMe } from '../api/users';
import { login as apiLogin } from '../api/auth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(!!sessionStorage.getItem("token"));

  useEffect(() => {
    const checkUser = async () => {
      if (isAuthenticated) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user", error);
          logout();
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await apiLogin(email, password);
      sessionStorage.setItem("token", data.access_token);
      const userData = await getMe();
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
