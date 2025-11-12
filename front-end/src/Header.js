
import React from "react";
import "./Header.css";
import Logo from "./logo.svg";

const Header = ({ title, borderColor = "#000" }) => {
  return (
    <div className="PageHeader">
      <div className="PageHeader-logo">
        <img
          src={Logo}
          alt="CommYOUnity Logo"
          height="200"
          width="300"
        />
      </div>
      <div
        className="PageHeader-title"
        style={{
          borderLeft: `3px solid ${borderColor}`,
          paddingLeft: "40px",
        }}
      >
        {title}
      </div>
    </div>
  );
};

export default Header;