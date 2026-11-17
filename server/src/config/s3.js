const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3Region = process.env.AWS_REGION || 'us-east-1';
const s3Bucket = process.env.AWS_S3_BUCKET || 'escalatehq-proofs';
const hasAwsCreds = Boolean(
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_ACCESS_KEY_ID.trim() !== '' &&
  !process.env.AWS_ACCESS_KEY_ID.includes('placeholder')
);

let s3Client = null;
if (hasAwsCreds) {
  s3Client = new S3Client({
    region: s3Region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log(`[Storage] AWS S3 Client initialized for bucket: ${s3Bucket} in ${s3Region}`);
} else {
  console.log('[Storage] AWS credentials not detected. Operating in local storage mode (uploads served via /uploads)');
}

/**
 * Upload a multer file (buffer or disk) to AWS S3 or local static directory
 * @param {Express.Multer.File} file
 * @param {string} prefix
 * @returns {Promise<string>} public URL
 */
const uploadEvidenceFile = async (file, prefix = 'proofs') => {
  const fileExt = path.extname(file.originalname) || '.jpg';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const key = `${prefix}/${timestamp}-${randomSuffix}${fileExt}`;

  // If AWS S3 credentials are provided, upload to AWS S3 using @aws-sdk/client-s3
  if (hasAwsCreds && s3Client) {
    try {
      const fileBuffer = file.buffer || fs.readFileSync(file.path);
      const command = new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        // Optional ACL if supported: ACL: 'public-read'
      });

      await s3Client.send(command);
      const s3Url = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
      console.log(`[Storage] Uploaded proof to AWS S3: ${s3Url}`);
      return s3Url;
    } catch (err) {
      console.error(`[Storage Error] S3 upload failed: ${err.message}. Falling back to local storage.`);
    }
  }

  // Local fallback storage
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFileName = `${timestamp}-${randomSuffix}${fileExt}`;
  const localFilePath = path.join(uploadsDir, localFileName);

  if (file.buffer) {
    fs.writeFileSync(localFilePath, file.buffer);
  } else if (file.path) {
    fs.copyFileSync(file.path, localFilePath);
  }

  const port = process.env.PORT || 5001;
  const baseUrl = process.env.SERVER_URL || `http://localhost:${port}`;
  const localUrl = `${baseUrl}/uploads/${localFileName}`;
  console.log(`[Storage] Saved proof locally: ${localUrl}`);
  return localUrl;
};

module.exports = {
  s3Client,
  uploadEvidenceFile,
  hasAwsCreds,
};
