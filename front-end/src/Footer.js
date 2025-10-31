import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <button className="footer-btn" onClick={() => navigate("/home")}>
        Home
      </button>
      <button className="footer-btn" onClick={() => navigate("/profilepage")}>
        Profile
      </button>
    </footer>
  );
};

export default Footer;