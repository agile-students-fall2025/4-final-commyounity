import React, { useState } from "react";
import { Link /*, useNavigate */ } from "react-router-dom";
import "./DeleteProfilePage.css";

export default function DeleteProfilePage() {
  const [deleted, setDeleted] = useState(false);
  // const navigate = useNavigate();

  function handleDelete() {
    // This is where we'd call the backend to permanently delete the account.
    console.log("TODO: call API to delete user profile");
    setDeleted(true);
    alert("Profile deleted (placeholder).");

    // After delete, we WANT to redirect the user to the sign-on / login page.
    // That page hasn't been built yet by the auth teammate.
    //
    // In the future this will be:
    // navigate("/login");
  }

  return (
    <div className="DeletePageOuter">
      <div className="DeletePageInner">

        <button
          className="delete-confirm-btn"
          onClick={handleDelete}
          disabled={deleted}
        >
          {deleted ? "Deleted" : "Delete Profile!"}
        </button>

        <div className="return-wrapper">
          {/* Temporary: send user somewhere that exists in the app */}
          <Link to="/profilepage" className="return-link">
            Return to Home
          </Link>
        </div>

        {!deleted && (
          <div className="dev-hint">
            (Later: this will actually delete the account,
            log the user out, and redirect to sign-on.)
          </div>
        )}
      </div>
    </div>
  );
}
