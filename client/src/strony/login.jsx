// src/strony/login.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/login.css'; // Assuming you have a CSS file for styling

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_refresh_token', refreshToken);
        navigate('/dom_zalogowany');
      }
    }
  }, [navigate]);

  const handleSpotifyLogin = () => {
    window.location.href = 'http://127.0.0.1:5000/login'; // Calls your backend
  };

  return (
    <div className='login-wrapper'>
      <div className="login">
        <button onClick={handleSpotifyLogin}>Login with Spotify</button>
      </div>
    </div>
  );
}

export default Login;


//
