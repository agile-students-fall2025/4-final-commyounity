import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>CommYOUnity</h1>
        <p>Connect Culture & Community</p>
      </div>
      
      <div className="home-menu">
        <button 
          className="menu-button"
          onClick={() => navigate('/viewboards')}
        >
          View Boards
        </button>
        
        <button 
          className="menu-button"
          onClick={() => navigate('/browse')}
        >
          Browse Boards
        </button>
        
        <button 
          className="menu-button"
          onClick={() => navigate('/profile')}
        >
          My Profile
        </button>
        
        <button 
          className="menu-button"
          onClick={() => navigate('/friends')}
        >
          Friends
        </button>
      </div>
    </div>
  );
};

export default Home;
