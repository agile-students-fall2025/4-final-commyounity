import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./NotificationSettingsPage.css";

export default function NotificationSettingsPage() {
  // Local toggle states for each notification type
  const [boardUpdatesOn, setBoardUpdatesOn] = useState(true);
  const [messagesOn, setMessagesOn] = useState(true);
  const [followersOn, setFollowersOn] = useState(true);

  return (
    <div className="NotifPage">
      {/* Back arrow at top */}
      <header className="notif-header">
        <Link to="/settings" className="notif-back">
          ←
        </Link>
      </header>

      {/* Row: Board Updates */}
      <div className="notif-row">
        <div className="notif-label">Board Updates</div>
        <button
          className="notif-toggle"
          onClick={() => setBoardUpdatesOn(!boardUpdatesOn)}
        >
          {boardUpdatesOn ? "On" : "Off"}
        </button>
      </div>

      {/* Row: New Messages */}
      <div className="notif-row">
        <div className="notif-label">New Messages</div>
        <button
          className="notif-toggle"
          onClick={() => setMessagesOn(!messagesOn)}
        >
          {messagesOn ? "On" : "Off"}
        </button>
      </div>

      {/* Row: New Follower */}
      <div className="notif-row">
        <div className="notif-label">New Follower</div>
        <button
          className="notif-toggle"
          onClick={() => setFollowersOn(!followersOn)}
        >
          {followersOn ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
