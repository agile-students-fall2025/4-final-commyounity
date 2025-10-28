import React from "react";
import "./FriendsHomePage.css";
import Logo from "./logo.svg"; // Import the logo

const FriendsHomePage = () => {
  return (
    <div className="FriendsHomePage">
      <div className="FriendsHomePage-Logotext">
        <div className="FriendsHomePage-textLogoText">
          <img src={Logo} alt="App Logo" className="app-logo" />
        </div>
      </div>
      <h1>Friends Home Page</h1>
      <p><i>Here you can manage your friends, requests, and more!</i></p>
    </div>
  );
};

export default FriendsHomePage;