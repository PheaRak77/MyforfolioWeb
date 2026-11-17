import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";

import AdminRoute from "./routes/AdminRoute";
import NetworkStatus from "./components/NetworkStatus";
import CanonicalUrlRedirect from "./components/CanonicalUrlRedirect";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Skills = lazy(() => import("./pages/Skills"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));

import FingerprintLoader from "./components/FingerprintLoader";

const PageLoader = () => (
  <div className="min-h-screen bg-[#fafafa] dark:bg-[#070b14] flex items-center justify-center p-4 transition-colors">
    <FingerprintLoader size="md" label="L O A D I N G" />
  </div>
);

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname, location.hash]);

  return (
    <>
      <CanonicalUrlRedirect />
      <NetworkStatus />
      <div key={location.pathname} className="animate-page-enter">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<PageLoader />}>
              <Register />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ResetPassword />
            </Suspense>
          }
        />

        <Route element={<AdminRoute />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/projects"
            element={
              <Suspense fallback={<PageLoader />}>
                <Projects />
              </Suspense>
            }
          />
          <Route
            path="/certificates"
            element={
              <Suspense fallback={<PageLoader />}>
                <Certificates />
              </Suspense>
            }
          />
          <Route
            path="/skills"
            element={
              <Suspense fallback={<PageLoader />}>
                <Skills />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            }
          />
          <Route
            path="/messages"
            element={
              <Suspense fallback={<PageLoader />}>
                <Messages />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
      </div>
    </>
  );
}
