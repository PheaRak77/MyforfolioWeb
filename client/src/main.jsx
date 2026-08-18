import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import "./index.css";

// Wake Render server early so first API call is faster
const apiBase =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "https://myportfolio-api-8b84.onrender.com";

fetch(`${apiBase}/api/health`, { mode: "cors" }).catch(() => {});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
