import React from 'react';
import './topnav.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEllipsis, faHome } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from 'react-router-dom';

function TopNav() {
  const navigate = useNavigate();

  return (
    <div className="topnav">
      {/* Left-side icons */}
      <div className='BackButton'>
        <FontAwesomeIcon icon={faChevronLeft} onClick={() => navigate(-1)} />
      </div>
      <div className="ForwardButton">
        <FontAwesomeIcon icon={faChevronRight} onClick={() => navigate(1)} />
      </div>
      <div className="left-icon">
        <FontAwesomeIcon icon={faEllipsis} />
      </div>

      {/* Centered search input */}
      <div className="SearchContainer">
        <input
          type="text"
          className="SearchBar"
          placeholder="Search for songs, artists..."
        />
      </div>

      {/* Right-side Home button */}
      <button onClick={() => navigate('/login')}>
        <FontAwesomeIcon icon={faHome} />
      </button>
    </div>
  );
}

export default TopNav;