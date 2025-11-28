// src/Protected.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const Protected = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  // no token -> kick to login
  if (!token) {
    return (
      <Navigate
        to="/login?error=protected"
        replace
        state={{ from: location }}
      />
    );
  }

  // token exists -> render the actual page
  return <>{children}</>;
};

export default Protected;