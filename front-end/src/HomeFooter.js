import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const HomeFooter = ({ backToHome = false }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://178.128.70.142/api/auth/logout", { method: "GET" });
    } catch (err) {
      console.error("Logout request to backend failed (ignoring):", err);
    }

    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleBack = () => {
    if (backToHome) {
      // Page says: back should go home
      navigate("/home", { replace: true });
      return;
    }

    // Normal behavior: go back if we have history, otherwise go home
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/home", { replace: true });
    }
  };

  return (
    <footer className="app-footer">
      <button className="footer-btn logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </footer>
  );
};

export default HomeFooter;