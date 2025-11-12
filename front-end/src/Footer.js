import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/logout", {
        method: "GET",
        credentials: "include",
      });
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      window.location.href = "http://localhost:3000/";
    }
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