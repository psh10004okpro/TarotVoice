const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Configure Cloudflare R2 client
 * R2 is S3-compatible, so we use AWS SDK
 */

let r2Client = null;

function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  // Check if R2 is configured
  if (!process.env.R2_ENABLED || process.env.R2_ENABLED !== 'true') {
    return null;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('Cloudflare R2 credentials not fully configured. Using local storage.');
    return null;
  }

  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log('Cloudflare R2 client initialized successfully');
    return r2Client;
  } catch (error) {
    console.error('Error initializing R2 client:', error);
    return null;
  }
}

/**
 * Check if R2 is enabled and properly configured
 */
function isR2Enabled() {
  return process.env.R2_ENABLED === 'true' && getR2Client() !== null;
}

/**
 * Get public URL for R2 object
 */
function getR2PublicUrl(key) {
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;

  if (publicDomain) {
    // Use custom domain if configured
    return `https://${publicDomain}/${key}`;
  } else {
    // Use R2.dev domain (public bucket required)
    const accountId = process.env.R2_ACCOUNT_ID;
    return `https://${bucketName}.${accountId}.r2.dev/${key}`;
  }
}

module.exports = {
  getR2Client,
  isR2Enabled,
  getR2PublicUrl,
};
