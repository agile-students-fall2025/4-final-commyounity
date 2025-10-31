import React from "react";
import { Link } from "react-router-dom";
import "./SettingsPage.css";
import { useNavigate } from "react-router-dom";
import Header from "./Header";


export default function SettingsPage() {
  const navigate = useNavigate();
  return (
    <><Header title="Settings" />
    <div className="settings-back-container">
  <button className="settings-back" onClick={() => navigate("/profilepage")}>
    ← Back
  </button>
</div>
    <div className="SettingsPage">
      <div className="settings-buttons">
        <Link to="/settings/notifications" className="settings-block">
          Notification
        </Link>

        <Link to="/settings/privacy" className="settings-block">
          Profile Privacy
        </Link>

        <Link to="/settings/change-password" className="settings-block">
          Change Password
        </Link>

      </div>
    </div>
    </>
  );
}
