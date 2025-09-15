import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForward,
  faBackward,
  faRandom,
  faRepeat,
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

  // Fetch access token from backend
  const getAccessToken = async () => {
    const response = await fetch('http://localhost:5000/get_access_token');
    const data = await response.json();
    return data.access_token;
  };

  // Transfer playback to your player device
  const transferPlaybackHere = async (device_id, token) => {
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [device_id],
        play: false,
      }),
    });
  };

  // Toggle shuffle on Spotify
  const toggleShuffle = async () => {
    if (!accessToken || !deviceId) return;

    const newShuffleState = !shuffleActive;
    setShuffleActive(newShuffleState);

    await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}&device_id=${deviceId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  };

  // Toggle repeat on Spotify
  const toggleRepeat = async () => {
    if (!accessToken || !deviceId) return;

    // Cycle repeat mode: off -> context -> track -> off
    // For simplicity, toggle between off and context
    const newRepeatState = !repeatActive;
    setRepeatActive(newRepeatState);

    await fetch(
      `https://api.spotify.com/v1/me/player/repeat?state=${newRepeatState ? 'context' : 'off'}&device_id=${deviceId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  };

  // Play or pause playback
  const togglePlayPause = () => {
    if (!player) return;

    player.togglePlay().catch((e) => console.error(e));
  };

  // Play previous track
  const onPrevious = () => {
    if (!player) return;

    player.previousTrack().catch((e) => console.error(e));
  };

  // Play next track
  const onNext = () => {
    if (!player) return;

    player.nextTrack().catch((e) => console.error(e));
  };

  // Fetch current playback state from Spotify Web API
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
        return;
      }

      const data = await res.json();
      if (!data) return;

      if (data.item) {
        setTrack({
          name: data.item.name,
          artists: data.item.artists.map((artist) => artist.name).join(', '),
          albumImage: data.item.album.images[0].url,
        });
      } else {
        setTrack(null);
      }
      setIsPlaying(data.is_playing);
      setShuffleActive(data.shuffle_state);
      // repeat_state: "off", "context", or "track"
      setRepeatActive(data.repeat_state !== 'off');
    } catch (error) {
      console.error('Error fetching current playback state:', error);
    }
  };

  useEffect(() => {
    // Load Spotify SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = async () => {
      const token = await getAccessToken();
      setAccessToken(token);

      const player = new window.Spotify.Player({
        name: 'React Spotify Player',
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization Error:', message);
      });
      player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication Error:', message);
      });
      player.addListener('account_error', ({ message }) => {
        console.error('Account Error:', message);
      });
      player.addListener('playback_error', ({ message }) => {
        console.error('Playback Error:', message);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state) => {
        if (!state) {
          setTrack(null);
          setIsPlaying(false);
          return;
        }

        const currentTrack = state.track_window.current_track;
        setTrack({
          name: currentTrack.name,
          artists: currentTrack.artists.map((a) => a.name).join(', '),
          albumImage: currentTrack.album.images[0].url,
        });

        setIsPlaying(!state.paused);
        setShuffleActive(state.shuffle);
        // repeat_mode: 0 (off), 1 (context), 2 (track)
        setRepeatActive(state.repeat_mode !== 0);
      });

      // Ready
      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
        transferPlaybackHere(device_id, token);
      });

      player.connect();
      setPlayer(player);

      // Initial fetch of current playback info for syncing UI
      fetchCurrentPlaybackState(token);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="playbar">
      {/* Left section with album art + track info */}
      <div className="player-left">
        {track ? (
          <>
            <img src={track.albumImage} alt="Album Art" className="album-art" />
            <div className="track-info">
              <div className="track-title">{track.name}</div>
              <div className="track-artist">{track.artists}</div>
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

          <button onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
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

        <div className="progress-bar">
          <div className="progress" />
        </div>
      </div>
    </div>
  );
}

export default PlayerBar;
