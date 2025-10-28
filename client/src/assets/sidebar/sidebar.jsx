import React, { useEffect } from "react";
import "./sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableList } from "@fortawesome/free-solid-svg-icons";


const Library = ({ isCollapsed, setIsCollapsed }) => {
  const handleToggle = () => {
    if (window.innerWidth > 768) {
      setIsCollapsed(!isCollapsed);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(false); // reset for mobile
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">

        <button id="toggleBtn" onClick={handleToggle}>
          <FontAwesomeIcon icon={faTableList} />
        </button>
      </div>

      <div className="filters">

      </div>

      <div className="search-sort">
      
      </div>

      <div className="library-list">
        <div className="library-item">

          <div className="item-info">
            
          </div>
        </div>
        <div className="library-item">

          <div className="item-info">
            
          </div>
        </div>
        <div className="library-item">

          <div className="item-info">
            
          </div>
        </div>
        <div className="library-item">

          <div className="item-info">
            
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Library;
