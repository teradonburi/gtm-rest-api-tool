import http from 'http';
import querystring from 'querystring';
import url from 'url';
import open from 'open'
import { config } from 'dotenv';
import  { google } from 'googleapis';
config();

const OAuth2 = google.auth.OAuth2;
const oAuth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

const authorizeUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/tagmanager.readonly']
});

oAuth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    // update token when expired
    oAuth2Client.setCredentials(tokens);
  }
});

http.createServer(async (req, res) => {
  if (req.url.indexOf('/oauth2callback') > -1) {
    // acquire the code from the querystring, and close the web server.
    const qs = querystring.parse(url.parse(req.url).query);
    console.log(`Code is ${qs.code}`);
    res.end('Authentication successful! Please return to the console.');
    
    // Now that we have the code, use that to acquire tokens.
    const r = await oAuth2Client.getToken(qs.code);
    
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens);
    console.info('Tokens acquired.', r.tokens);

    const tagmanager = google.tagmanager({
      version: 'v2',
      auth: oAuth2Client
    });

    tagmanager.accounts.list().then((res) => {
      console.log(res.data);
    }).catch((err) => {
      console.error(err);
    });
  } else {
    res.end('Nothing to see here!');
  }
}).listen(3000, () => {
  // open the browser to the authorize url to start the workflow
  open(authorizeUrl);
});