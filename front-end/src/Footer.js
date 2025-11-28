import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // optional: tell the backend we're "logging out"
      await fetch("http://localhost:4000/auth/logout", {
        method: "GET",
      });
    } catch (err) {
      console.error("Logout request to backend failed (ignoring):", err);
    }

    // 🔥 actual logout for the frontend: remove JWT
    localStorage.removeItem("token");
    // if you stored other auth stuff, clear it too:
    // localStorage.removeItem("username");
    // localStorage.removeItem("email");

    // go back to login screen
    navigate("/login", { replace: true });
  };

  return (
    <footer className="app-footer">
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