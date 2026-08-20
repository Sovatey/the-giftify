import React from "react";
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from "./screen/login";
import POSScreen from "./screen/pos";
import DashboardScreen from "./screen/admin/dashboard";
import InventoryScreen from "./screen/admin/inventory";
import UserScreen from "./screen/admin/user";

import FloatingDecorations from "./components/FloatingDecorations";
import InteractiveMascot from "./components/Mascot/InteractiveMascot";

// Protected Route Wrapper enforcing login & role access permissions
const ProtectedRoute = ({ children, routePath }) => {
  const { token, hasPermission } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (routePath && !hasPermission(routePath, 'view')) {
    // If user has access to POS, redirect to /pos, else /dashboard
    return <Navigate to="/pos" replace />;
  }

  return children;
};

const RoutesConfig = () => {
  return (
    <AuthProvider>
      <FloatingDecorations />
      <InteractiveMascot
        image="/mascot_cat.png"
        sleepImage="/mascot_cat_sleep.png"
        initialPosition="bottom-right"
        enableWalking={false}
        enableParticles={true}
      />
      <Routes>
        <Route path="/" element={<LoginScreen />} />

        <Route
          path="/pos"
          element={
            <ProtectedRoute routePath="/pos">
              <POSScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute routePath="/dashboard">
              <DashboardScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute routePath="/inventory">
              <InventoryScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user"
          element={
            <ProtectedRoute routePath="/user">
              <UserScreen />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default RoutesConfig;
