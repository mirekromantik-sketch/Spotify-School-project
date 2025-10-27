import React, { useState } from 'react';
import Sidebar from '../assets/sidebar/sidebar.jsx';
import './CSS/main.css';
import PlayerBar from '../assets/playerbar/playerbar.jsx';
import Queue from '../assets/queue/queue.jsx';
import TopNav from '../assets/Topnav/TopNav.jsx';

function Main() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="dom-zalogowany-wrapper"
      style={{
        gridTemplateColumns: `${isCollapsed ? "80px" : "250px"} 1fr 270px`,
      }}
    >
      {/* Top navigation */}
      <TopNav />

      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main content */}
      <div className={`main ${isCollapsed ? "collapsed" : ""}`}>
        <p></p>
      </div>

      <Queue />

      {/* PlayerBar */}
      <PlayerBar />
    </div>
  );
}

export default Main;
