import React from "react";
import { Route, Routes } from 'react-router-dom';
import HomePage from './screen/admin/home'; 
import DashboardScreen from "./screen/admin/dashboard";
import InventoryScreen from "./screen/admin/inventory"
import LoginScreen from "./screen/login";
import UserScreen from "./screen/admin/user";

const RoutesConfig = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/dashboard" element={<DashboardScreen />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/inventory" element={<InventoryScreen />} />
      <Route path="/user" element={<UserScreen />} />
    </Routes>
  );
};

export default RoutesConfig;
