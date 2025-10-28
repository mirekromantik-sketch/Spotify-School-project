import React, { useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../assets/sidebar/sidebar.jsx';
 import PlayerBar from '../assets/playerbar/playerbar.jsx';
import Queue from '../assets/queue/queue.jsx';
import TopNav from '../assets/Topnav/TopNav.jsx';
import './CSS/main.css';

function Main() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="dom-zalogowany-wrapper"
      style={{
        gridTemplateColumns: `${isCollapsed ? "80px" : "250px"} 1fr 270px`,
      }}
    >
      <TopNav />
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`main ${isCollapsed ? "collapsed" : ""}`}>
        <p></p>
      </div>
      <Queue />
      <PlayerBar />
    </div>
  );
}

export default Main;
