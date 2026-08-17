import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Certificates from "./pages/Certificates";
import Skills from "./pages/Skills";
import Profile from "./pages/Profile";

import AdminRoute from "./routes/AdminRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin-only management routes */}
      <Route element={<AdminRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
