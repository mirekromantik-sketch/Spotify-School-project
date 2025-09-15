var express = require('express');
var request = require('request');
var crypto = require('crypto');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'fd982323aaea43209c7310a79caf569e'; // Your clientId
var client_secret = '9c6b8aa65dbb40fc90acd0a2113d42ce'; // Your clientSecret
var redirect_uri = 'http://127.0.0.1:5000/callback'; // Your redirect URI

const generateRandomString = (length) => {
  return crypto
    .randomBytes(60)
    .toString('hex')
    .slice(0, length);
}

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

// Simple in-memory token storage (replace with DB for production)
let userTokens = {
  access_token: null,
  refresh_token: null,
  expires_at: null // timestamp in ms when access token expires
};

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  var scope = 'user-read-private user-read-email streaming';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
    return;
  }

  res.clearCookie(stateKey);

  var authOptions = {
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

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {

      userTokens.access_token = body.access_token;
      userTokens.refresh_token = body.refresh_token;
      userTokens.expires_at = Date.now() + body.expires_in * 1000; // expires_in is in seconds

      // For testing: get user profile data
      var options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + userTokens.access_token },
        json: true
      };

      request.get(options, function(error, response, body) {
        console.log('Spotify user info:', body);
      });

      // Redirect to your React frontend with tokens in URL hash (optional)
      const frontendUri = 'http://localhost:5173';  // Change if needed
      res.redirect(`${frontendUri}/dom_zalogowany#` +
        querystring.stringify({
          access_token: userTokens.access_token,
          refresh_token: userTokens.refresh_token
        }));

    } else {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    }
  });
});

// New endpoint to provide a valid access token, refreshing if needed
app.get('/get_access_token', function(req, res) {
  if (!userTokens.access_token || !userTokens.refresh_token) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  const now = Date.now();

  // If token expires in less than 1 minute, refresh it
  if (now >= userTokens.expires_at - 60000) {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: userTokens.refresh_token
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        userTokens.access_token = body.access_token;
        userTokens.expires_at = Date.now() + body.expires_in * 1000;
        // Usually no new refresh token on refresh, keep old one
        res.json({ access_token: userTokens.access_token });
      } else {
        console.error('Failed to refresh token', error || body);
        res.status(500).json({ error: 'Failed to refresh access token' });
      }
    });
  } else {
    // Token still valid
    res.json({ access_token: userTokens.access_token });
  }
});

console.log('Listening on 5000');
app.listen(5000);
