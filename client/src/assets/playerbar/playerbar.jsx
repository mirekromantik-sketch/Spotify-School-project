import React, { useState, useEffect, useRef } from 'react';
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
  faMobile,
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
  const [devices, setDevices] = useState([]);
  const [showDevices, setShowDevices] = useState(false);
  const progressBarRef = useRef(null);

  // --- Helper: format time (ms → mm:ss) ---
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

  // --- Fetch playback state (track info + progress) ---
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

      // update progress bar
      if (progressBarRef.current && data.item?.duration_ms) {
        const progressPercentage = (data.progress_ms / data.item.duration_ms) * 100;
        progressBarRef.current.style.setProperty('--progress', `${progressPercentage}%`);
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
  const onPrevious = () => player?.previousTrack().catch(console.error);
  const onNext = () => player?.nextTrack().catch(console.error);

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
    player?.setVolume(newVolume).catch(console.error);
  };

  // --- Devices handling ---
  const fetchDevices = async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDevices(data.devices);
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };
  const handleDeviceClick = async () => {
    setShowDevices(!showDevices);
    if (!devices.length) await fetchDevices();
  };
  const transferPlayback = async (id) => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [id], play: true }),
      });
      setShowDevices(false);
    } catch (err) {
      console.error('Error transferring playback:', err);
    }
  };

  // --- Initialize Web Playback SDK ---
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
          console.log('Player ready with device ID', device_id);
          setDeviceId(device_id);
        });

        p.connect().then(success => {
          if (success) console.log('Web Playback SDK connected');
        });

        setPlayer(p);
      };

      const intervalId = setInterval(() => fetchCurrentPlaybackState(token), 1000);
      fetchCurrentPlaybackState(token);

      return () => {
        clearInterval(intervalId);
        document.body.removeChild(script);
      };
    };

    initPlayer();
  }, []);

  // --- Transfer playback button ---
  const handlePlayOnThisDevice = async () => {
    if (!deviceId) return console.warn('No device ID available');
    const token = await getAccessToken();
    if (!token) return;
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_ids: [deviceId], play: true }),
    });
    console.log('Playback transferred to SDK device');
  };

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
              {deviceInfo && <div className="device-info">Playing on: {deviceInfo.name} ({deviceInfo.type})</div>}
            </div>
          </>
        ) : <div className="track-info"><div className="track-title">No track playing</div></div>}
      </div>

      {/* Center */}
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
          <input type="range" min="0" max={durationMs} value={progressMs} readOnly ref={progressBarRef} />
          <span className="time">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Right */}
      <div className="player-right">
        <button><FontAwesomeIcon icon={faList} /></button>
        <div className="device-icon-wrapper">
          <button onClick={handleDeviceClick} className="device-icon">
            <FontAwesomeIcon icon={faMobile} />
          </button>
          {showDevices && (
            <div className="device-popup">
              <div className="device-popup-header">Available Devices</div>
              <div className="device-popup-list">
                {devices.length === 0 ? (
                  <div className="device-popup-item">No devices found</div>
                ) : (
                  devices.map(d => (
                    <div key={d.id} className="device-popup-item" onClick={() => transferPlayback(d.id)}>
                      {d.name} {d.is_active ? '🎵' : ''}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <FontAwesomeIcon icon={faVolumeHigh} />
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="volume-slider" />

        {/* New SDK transfer button */}
        <button onClick={handlePlayOnThisDevice} style={{ marginLeft: '10px' }}>Play on this device</button>
      </div>
    </div>
  );
}

export default PlayerBar;
