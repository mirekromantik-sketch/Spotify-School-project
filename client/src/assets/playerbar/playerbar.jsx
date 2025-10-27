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
  const [accessToken, setAccessToken] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [deviceInfo, setDeviceInfo] = useState(null);

  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const formatTime = (ms) => {
    if (!ms) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const getAccessToken = async () => {
    const response = await fetch('http://localhost:5000/get_access_token');
    const data = await response.json();
    return data.access_token;
  };

  const toggleShuffle = async () => {
    if (!accessToken || !deviceId) return;
    const newShuffleState = !shuffleActive;
    setShuffleActive(newShuffleState);

    await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}&device_id=${deviceId}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` } }
    );
  };

  const toggleRepeat = async () => {
    if (!accessToken || !deviceId) return;
    const newRepeatState = !repeatActive;
    setRepeatActive(newRepeatState);

    await fetch(
      `https://api.spotify.com/v1/me/player/repeat?state=${newRepeatState ? 'context' : 'off'}&device_id=${deviceId}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` } }
    );
  };

  const togglePlayPause = () => {
    if (!player) return;
    player.togglePlay().catch((e) => console.error(e));
  };

  const onPrevious = () => {
    if (!player) return;
    player.previousTrack().catch((e) => console.error(e));
  };

  const onNext = () => {
    if (!player) return;
    player.nextTrack().catch((e) => console.error(e));
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    e.target.style.setProperty('--value', `${newVolume * 100}%`);

    if (player) {
      player.setVolume(newVolume).catch((err) => console.error(err));
    }
  };

  // Fetch currently playing track from any device
  const fetchCurrentPlaybackState = async (token) => {
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
          artists: data.item.artists.map((a) => a.name).join(', '),
          albumImage: data.item.album.images[0].url,
        });
        setDurationMs(data.item.duration_ms);
      } else {
        setTrack(null);
      }

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
      }
    } catch (err) {
      console.error('Error fetching playback state:', err);
    }
  };

  useEffect(() => {
    const initPlayer = async () => {
      const token = await getAccessToken();
      setAccessToken(token);

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'React Spotify Player',
          getOAuthToken: (cb) => cb(token),
          volume: 0.5,
        });

        player.addListener('player_state_changed', (state) => {
          if (!state) return;
          const currentTrack = state.track_window.current_track;
          if (currentTrack) {
            setTrack({
              name: currentTrack.name,
              artists: currentTrack.artists.map((a) => a.name).join(', '),
              albumImage: currentTrack.album.images[0].url,
            });
          }
          setIsPlaying(!state.paused);
          setProgressMs(state.position);
          setDurationMs(state.duration);
        });

        player.addListener('ready', ({ device_id }) => {
          setDeviceId(device_id);
          // **Removed transferPlaybackHere()** so web player doesn't take over
        });

        player.connect();
        setPlayer(player);
      };

      // Poll every 5 seconds for any active playback
      const intervalId = setInterval(() => {
        fetchCurrentPlaybackState(token);
      }, 5000);

      // initial fetch
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

      {/* Center */}
      <div className="controls-section">
        <div className="controls">
          <button
            className={`shuffle ${shuffleActive ? 'active' : ''}`}
            onClick={toggleShuffle}
            aria-label="Shuffle"
          >
            <FontAwesomeIcon icon={faRandom} />
          </button>

          <button onClick={onPrevious} aria-label="Previous">
            <FontAwesomeIcon icon={faBackward} />
          </button>

          <button
            className="play-pause"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </button>

          <button onClick={onNext} aria-label="Next">
            <FontAwesomeIcon icon={faForward} />
          </button>

          <button
            className={`repeat ${repeatActive ? 'active' : ''}`}
            onClick={toggleRepeat}
            aria-label="Repeat"
          >
            <FontAwesomeIcon icon={faRepeat} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="progress-container">
          <span className="time">{formatTime(progressMs)}</span>
          <div className="progress-bar">
            <div
              className="progress"
              style={{
                width: durationMs ? `${(progressMs / durationMs) * 100}%` : "0%",
              }}
            ></div>
          </div>
          <span className="time">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Right */}
      <div className="player-right">
        <button aria-label="Queue">
          <FontAwesomeIcon icon={faList} />
        </button>
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
