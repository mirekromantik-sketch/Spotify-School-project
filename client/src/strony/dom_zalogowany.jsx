import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/dom_zalogowany.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import PlayerBar from '../assets/playerbar/playerbar.jsx';  // Import the PlayerBar component

function DomZalogowany() {
  const navigate = useNavigate();

  return (
    <div className="dom-zalogowany-wrapper">
      <div className="topnav">
        <div className="left-icon">
          <FontAwesomeIcon icon={faEllipsis} />
        </div>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>

      <div className="biblioteka"></div>
      <div className="glowne"></div>
      <div className="kolejka"></div>

      {/* Display the PlayerBar component here */}
      <PlayerBar />
    </div>
  );
}

export default DomZalogowany;
