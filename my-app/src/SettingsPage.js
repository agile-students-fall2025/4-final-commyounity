import React from "react";
import { Link } from "react-router-dom";
import "./SettingsPage.css";

export default function SettingsPage() {
  return (
    <div className="SettingsPage">

      {/* Top bar with back arrow */}
      <header className="settings-header">
        <Link to="/profilepage" className="settings-back">
          ←
        </Link>
      </header>

      {/* Settings blocks */}
      <Link to="/settings/notifications" className="settings-block settings-link">
        Notification
      </Link>

      <div className="settings-block">
        Profile Privacy
      </div>

    </div>
  );
}
