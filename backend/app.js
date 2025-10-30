// app.js
const express = require('express');
const request = require('request');
const crypto = require('crypto');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const db = require('./db'); // SQLite connection

// Spotify credentials
const client_id = 'fd982323aaea43209c7310a79caf569e';
const client_secret = '9c6b8aa65dbb40fc90acd0a2113d42ce';
const redirect_uri = 'http://127.0.0.1:5000/callback';

const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString('hex').slice(0, length);
};

const stateKey = 'spotify_auth_state';
const app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser())
   .use(express.json());

// --- Login endpoint ---
app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email streaming';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

// --- Callback endpoint ---
app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (!state || state !== storedState) {
    return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
  }

  res.clearCookie(stateKey);

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      const refresh_token = body.refresh_token;
      const expires_at = Date.now() + body.expires_in * 1000;

      // Get user profile
      const options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };

      request.get(options, (error, response, body) => {
        if (error) {
          console.error('Error fetching user profile:', error);
          return res.status(500).send('Failed to fetch user profile');
        }

        const { id: spotify_id, display_name: username, email, external_urls } = body;
        const spotify_profile_url = external_urls.spotify;

        // Save/update user in SQLite with tokens
        try {
          db.prepare(`
            INSERT OR REPLACE INTO Users (
              spotify_id, username, email, spotify_profile_url,
              access_token, refresh_token, expires_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(spotify_id, username, email, spotify_profile_url, access_token, refresh_token, expires_at);

          console.log('User saved/updated:', username);
        } catch (err) {
          console.error('Failed to save user to SQLite:', err);
        }

        // Redirect to frontend with hash
        const frontendUri = 'http://localhost:5173';
        res.redirect(`${frontendUri}/main#` +
          querystring.stringify({
            access_token,
            refresh_token,
            spotify_id
          }));
      });
    } else {
      res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
    }
  });
});

// --- Endpoint to get a valid access token ---
app.get('/get_access_token/:spotify_id', async (req, res) => {
  const spotify_id = req.params.spotify_id;

  try {
    const user = db.prepare(`
      SELECT access_token, refresh_token, expires_at FROM Users WHERE spotify_id = ?
    `).get(spotify_id);

    if (!user) return res.status(400).json({ error: 'User not authenticated' });

    const now = Date.now();

    // Refresh if expired
    if (now >= user.expires_at - 60000) {
      const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
          grant_type: 'refresh_token',
          refresh_token: user.refresh_token
        },
        json: true
      };

      request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const newAccessToken = body.access_token;
          const expiresAt = Date.now() + body.expires_in * 1000;

          db.prepare(`UPDATE Users SET access_token = ?, expires_at = ? WHERE spotify_id = ?`)
            .run(newAccessToken, expiresAt, spotify_id);

          return res.json({ access_token: newAccessToken });
        } else {
          console.error('Failed to refresh token', error || body);
          return res.status(500).json({ error: 'Failed to refresh access token' });
        }
      });
    } else {
      return res.json({ access_token: user.access_token });
    }
  } catch (err) {
    console.error('Database error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

console.log('Listening on port 5000');
app.listen(5000);
