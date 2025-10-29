const fs = require('fs');
const path = require('path');

/**
 * Setup Google Cloud credentials from environment variable or file
 * Railway and other cloud platforms use environment variables for credentials
 */
function setupGoogleCredentials() {
  // Check if credentials JSON is provided as environment variable
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      // Parse the JSON string
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

      // Create a temporary credentials file
      const credentialsPath = path.join(__dirname, '../../google-credentials.json');
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));

      // Set the environment variable to point to the file
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

      console.log('Google Cloud credentials loaded from environment variable');
      return true;
    } catch (error) {
      console.error('Error parsing GOOGLE_CREDENTIALS_JSON:', error.message);
      return false;
    }
  }

  // Check if credentials file path is provided
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (fs.existsSync(credentialsPath)) {
      console.log('Google Cloud credentials loaded from file:', credentialsPath);
      return true;
    } else {
      console.warn('Google Cloud credentials file not found:', credentialsPath);
      return false;
    }
  }

  console.warn('Google Cloud credentials not configured. STT/TTS services requiring Google Cloud will not work.');
  return false;
}

module.exports = { setupGoogleCredentials };
