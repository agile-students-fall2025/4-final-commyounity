// src/Protected.js
import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const Protected = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    let token = localStorage.getItem("token");

    // 1) Token exists in URL from Google callback
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      token = urlToken;

      // Remove ?token= from URL
      params.delete("token");
      const newSearch = params.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : "");
      navigate(newPath, { replace: true });
    }

    // 2) Evaluate login status
    setIsLoggedIn(!!token);
    setReady(true);
  }, [location, navigate]);

  if (!ready) return null; // prevent flash

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default Protected;