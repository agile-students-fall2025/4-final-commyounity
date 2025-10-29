import React from "react";
import { Link } from "react-router-dom";
import "./SettingsPage.css";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();
  return (
    <div className="SettingsPage">
      <header className="settings-header">
        <button className="settings-back" onClick={() => navigate("/profilepage")}>
          ←
        </button>
      </header>

      <div className="settings-buttons">
        <Link to="/settings/notifications" className="settings-block">
          Notification
        </Link>

        <Link to="/settings/privacy" className="settings-block">
          Profile Privacy
        </Link>
      </div>
    </div>
  );
}
