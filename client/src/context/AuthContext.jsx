import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");
        const urlUser = params.get("user");

        if (urlToken) {
          localStorage.setItem("token", urlToken);

          if (urlUser) {
            localStorage.setItem("user", urlUser);
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }

        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken) {
          setToken(storedToken);

          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          // Refresh profile in background — do not block public portfolio rendering
          api
            .get("/auth/me")
            .then(({ data }) => {
              setUser(data.user);
              localStorage.setItem("user", JSON.stringify(data.user));
            })
            .catch((error) => {
              if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
                setToken(null);
              }
            });
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", {
      identifier,
      password,
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
