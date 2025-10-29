const crypto = require('crypto');

/**
 * Generate a hash for caching based on text, service, and voice settings
 */
function generateHash(text, service, voiceId = '', additionalParams = {}) {
  const data = JSON.stringify({
    text: text.trim(),
    service,
    voiceId,
    ...additionalParams,
  });

  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = { generateHash };
