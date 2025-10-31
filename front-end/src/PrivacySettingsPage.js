import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PrivacySettingsPage.css";
import Header from "./Header";


export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  // State variables for each setting
  // 1. Profile Visibility (toggle between "Private" and "Public")
  const [visibility, setVisibility] = useState("Private");

  // 2. Who Can Message Me (cycle between options: Everyone / Friends Only)
  const [canMessage, setCanMessage] = useState("Everyone");

  // 3. Online Status (On/Off like a boolean)
  const [onlineStatusOn, setOnlineStatusOn] = useState(true);

  // Handlers:
  const toggleVisibility = () => {
    setVisibility((prev) => (prev === "Private" ? "Public" : "Private"));
  };

  const toggleCanMessage = () => {
    setCanMessage((prev) =>
      prev === "Everyone" ? "Friends Only" : "Everyone"
    );
  };

  const toggleOnlineStatus = () => {
    setOnlineStatusOn((prev) => !prev);
  };

  return (
    <><Header title="Privacy Settings" />
    <div className="PrivacyPage">
      {/* Back arrow at top */}
      <header className="privacy-header">
        <button
            className="privacy-back"
            onClick={() => navigate("/settings")}
          >
            ← Back
        </button>
      </header>

      {/* Row: Profile Visibility */}
      <div className="privacy-row">
        <div className="privacy-label">Profile Visibility</div>
        <button className="privacy-toggle" onClick={toggleVisibility}>
          {visibility}
        </button>
      </div>

      {/* Row: Who Can Message Me */}
      <div className="privacy-row">
        <div className="privacy-label">Who Can Message Me</div>
        <button className="privacy-toggle" onClick={toggleCanMessage}>
          {canMessage}
        </button>
      </div>

      {/* Row: Online Status */}
      <div className="privacy-row">
        <div className="privacy-label">Online Status</div>
        <button className="privacy-toggle" onClick={toggleOnlineStatus}>
          {onlineStatusOn ? "On" : "Off"}
        </button>
      </div>
    </div>
    </>
  );
}
