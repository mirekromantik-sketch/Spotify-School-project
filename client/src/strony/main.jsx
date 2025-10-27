import React, { useState } from 'react';
import Sidebar from '../assets/sidebar/sidebar.jsx';
import './CSS/main.css';
import PlayerBar from '../assets/playerbar/playerbar.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Queue from '../assets/queue/queue.jsx'


function Main() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="dom-zalogowany-wrapper"
      style={{
        gridTemplateColumns: `${isCollapsed ? "80px" : "250px"} 1fr 270px`,
      }}
    >
      {/* Top navigation */}
      <div className="topnav">
        <div className="left-icon"><FontAwesomeIcon icon={faEllipsis} /></div>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>

      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main content */}
      <div className={`main ${isCollapsed ? "collapsed" : ""}`}>
        <p></p>
      </div>

      <Queue/>

      {/* PlayerBar */}
      <PlayerBar />
    </div>
  );
}

export default Main;
