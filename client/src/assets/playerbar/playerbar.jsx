import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForward,
  faBackward,
  faRandom,
  faRepeat,
  faVolumeHigh,
  faList,
} from '@fortawesome/free-solid-svg-icons';
import '../playerbar/playerbar.css';

function PlayerBar() {
  const [shuffleActive, setShuffleActive] = useState(false);
  const [repeatActive, setRepeatActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState(null);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  // --- Helper to format time ---
  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // --- Get access token from backend ---
  const getAccessToken = async () => {
    const spotifyId = localStorage.getItem('spotify_id');
    if (!spotifyId) {
      console.error('No Spotify ID found in localStorage');
      return null;
    }

    try {
      const res = await fetch(`http://localhost:5000/get_access_token/${spotifyId}`);
      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to get access token:', res.status, text);
        return null;
      }
      const data = await res.json();
      return data.access_token;
    } catch (err) {
      console.error('Error fetching access token:', err);
      return null;
    }
  };

  // --- Fetch currently playing track ---
  const fetchCurrentPlaybackState = async (token) => {
    if (!token) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 204 || res.status > 400) {
        setTrack(null);
        setIsPlaying(false);
        setShuffleActive(false);
        setRepeatActive(false);
        setDeviceInfo(null);
        setProgressMs(0);
        setDurationMs(0);
        return;
      }

      const data = await res.json();
      if (!data) return;

      if (data.item) {
        setTrack({
          name: data.item.name,
          artists: data.item.artists.map(a => a.name).join(', '),
          albumImage: data.item.album.images[0].url,
        });
        setDurationMs(data.item.duration_ms);
      } else setTrack(null);

      setIsPlaying(data.is_playing);
      setShuffleActive(data.shuffle_state);
      setRepeatActive(data.repeat_state !== 'off');
      setProgressMs(data.progress_ms || 0);

      if (data.device) {
        setDeviceInfo({
          name: data.device.name,
          type: data.device.type,
          isActive: data.device.is_active,
        });
        setDeviceId(data.device.id || data.device.device_id);
      }
    } catch (err) {
      console.error('Error fetching playback state:', err);
    }
  };

  // --- Player control functions ---
  const togglePlayPause = () => {
    if (!player) return;
    player.togglePlay().catch(console.error);
  };

  const onPrevious = () => {
    if (!player) return;
    player.previousTrack().catch(console.error);
  };

  const onNext = () => {
    if (!player) return;
    player.nextTrack().catch(console.error);
  };

  const toggleShuffle = async () => {
    const token = await getAccessToken();
    if (!token || !deviceId) return;

    const newState = !shuffleActive;
    setShuffleActive(newState);

    fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newState}&device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(console.error);
  };

  const toggleRepeat = async () => {
    const token = await getAccessToken();
    if (!token || !deviceId) return;

    const newState = !repeatActive;
    setRepeatActive(newState);

    fetch(`https://api.spotify.com/v1/me/player/repeat?state=${newState ? 'context' : 'off'}&device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(console.error);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    e.target.style.setProperty('--value', `${newVolume * 100}%`);

    if (player) player.setVolume(newVolume).catch(console.error);
  };

  // --- Initialize Spotify Web Playback SDK ---
  useEffect(() => {
    const initPlayer = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const p = new window.Spotify.Player({
          name: 'React Spotify Player',
          getOAuthToken: cb => cb(token),
          volume: 0.5,
        });

        p.addListener('player_state_changed', state => {
          if (!state) return;
          const currentTrack = state.track_window.current_track;
          if (currentTrack) {
            setTrack({
              name: currentTrack.name,
              artists: currentTrack.artists.map(a => a.name).join(', '),
              albumImage: currentTrack.album.images[0].url,
            });
          }
          setIsPlaying(!state.paused);
          setProgressMs(state.position);
          setDurationMs(state.duration);
        });

        p.addListener('ready', ({ device_id }) => {
          setDeviceId(device_id);
        });

        p.connect();
        setPlayer(p);
      };

      // Poll every 5s
      const intervalId = setInterval(() => fetchCurrentPlaybackState(token), 5000);
      fetchCurrentPlaybackState(token);

      return () => {
        clearInterval(intervalId);
        document.body.removeChild(script);
      };
    };

    initPlayer();
  }, []);

  return (
    <div className="playbar">
      {/* Left */}
      <div className="player-left">
        {track ? (
          <>
            <img src={track.albumImage} alt="Album Art" className="album-art" />
            <div className="track-info">
              <div className="track-title">{track.name}</div>
              <div className="track-artist">{track.artists}</div>
              {deviceInfo && (
                <div className="device-info">
                  Playing on: {deviceInfo.name} ({deviceInfo.type})
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="track-info">
            <div className="track-title">No track playing</div>
          </div>
        )}
      </div>

      {/* Center controls */}
      <div className="controls-section">
        <div className="controls">
          <button className={`shuffle ${shuffleActive ? 'active' : ''}`} onClick={toggleShuffle}>
            <FontAwesomeIcon icon={faRandom} />
          </button>
          <button onClick={onPrevious}><FontAwesomeIcon icon={faBackward} /></button>
          <button className="play-pause" onClick={togglePlayPause}>
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </button>
          <button onClick={onNext}><FontAwesomeIcon icon={faForward} /></button>
          <button className={`repeat ${repeatActive ? 'active' : ''}`} onClick={toggleRepeat}>
            <FontAwesomeIcon icon={faRepeat} />
          </button>
        </div>

        {/* Progress */}
        <div className="progress-container">
          <span className="time">{formatTime(progressMs)}</span>
          <div className="progress-bar">
            <div className="progress" style={{ width: durationMs ? `${(progressMs / durationMs) * 100}%` : '0%' }}></div>
          </div>
          <span className="time">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Right */}
      <div className="player-right">
        <button><FontAwesomeIcon icon={faList} /></button>
        <FontAwesomeIcon icon={faVolumeHigh} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
}

export default PlayerBar;
