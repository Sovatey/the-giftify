import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'Cashier');
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('permissions');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/user/login/', { username, password });
      const { token: userToken, user: userData, role: userRole, permissions: userPerms } = res.data;

      setToken(userToken);
      setUser(userData);
      setRole(userRole);
      setPermissions(userPerms);

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);
      localStorage.setItem('permissions', JSON.stringify(userPerms));

      if (userData?.company) {
        localStorage.setItem('selectedCompanyId', String(userData.company));
      } else {
        localStorage.removeItem('selectedCompanyId');
      }

      return { success: true, role: userRole };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole('Cashier');
    setPermissions([]);
    localStorage.clear();
  };

  // Helper function to check permissions by route path and action
  const hasPermission = (routePath, action = 'view') => {
    if (role === 'Admin' || user?.is_superuser) return true;
    if (!permissions || permissions.length === 0) {
      // Fallbacks if no specific matrix defined
      if (role === 'Cashier' && routePath === '/pos') return true;
      if (role === 'Manager' && ['/pos', '/inventory', '/dashboard', '/social-publisher'].includes(routePath)) return true;

      return false;
    }
    const perm = permissions.find(p => p.route_path === routePath);
    return perm ? !!perm[action] : false;
  };

  return (
    <AuthContext.Provider value={{ user, token, role, permissions, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
