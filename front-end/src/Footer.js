import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/auth/logout", { method: "GET" });
    } catch (err) {
      console.error("Logout request to backend failed (ignoring):", err);
    }

    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <footer className="app-footer">
      <button
        className="footer-btn"
        onClick={() => {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate("/home", { replace: true });
          }
        }}
      >
        ←
      </button>

      <button className="footer-btn" onClick={() => navigate("/home")}>
        Home
      </button>

      <button className="footer-btn" onClick={() => navigate("/profilepage")}>
        Profile
      </button>

      <button className="footer-btn logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </footer>
  );
};

export default Footer;