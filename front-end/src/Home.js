import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Header from "./Header";
import HomeFooter from "./HomeFooter";

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
    <Header title="Home Page" />
    <div className="home-container">
      
      <div className="home-menu">
        <button 
          className="menu-button"
          onClick={() => navigate('/viewboards')}
        >
          View Boards
        </button>
        
        <button 
          className="menu-button"
          onClick={() => navigate('/browseboards')}
        >
          Browse Boards
        </button>

        <button 
          className="menu-button"
          onClick={() => navigate('/createboard')}
        >
          Create Board
        </button>
        
        
        <button 
          className="menu-button"
          onClick={() => navigate('/profilepage')}
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
    <HomeFooter backToHome />
    </>
  );
};

export default Home;
