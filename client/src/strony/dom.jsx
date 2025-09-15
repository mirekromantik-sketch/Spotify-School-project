// src/strony/dom.jsx
import { useNavigate } from 'react-router-dom';
import './CSS/dom.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';


function Dom() {
  const navigate = useNavigate();


  return (
    <div className='Dom-wrapper'>
      <div className="topnav">
        <div className="left-icon">
          <FontAwesomeIcon icon={faEllipsis} />
        </div>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>

      <div className="biblioteka"></div>
      <div className="glowne"></div>
      <div className="kolejka"></div>


    </div>
  );
}

export default Dom;
