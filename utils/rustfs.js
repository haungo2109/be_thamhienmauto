const { Client } = require('minio');

const minioClient = new Client({
  endPoint: process.env.RUSTFS_ENDPOINT,
  useSSL: process.env.RUSTFS_USE_SSL === 'true',
  accessKey: process.env.RUSTFS_ACCESS_KEY,
  secretKey: process.env.RUSTFS_SECRET_KEY,
  region: process.env.RUSTFS_REGION
});

const bucketName = process.env.RUSTFS_BUCKET;
const BASE_URL = `${process.env.RUSTFS_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.RUSTFS_ENDPOINT}/${bucketName}`;

// Function to upload file
const uploadFile = async (fileName, fileBuffer, mimeType) => {
  try {
    await minioClient.putObject(bucketName, fileName, fileBuffer, {
      'Content-Type': mimeType
    });
    const url = `${BASE_URL}/${fileName}`;
    return url;
  } catch (error) {
    throw new Error(`MinIO upload failed: ${error.message}`);
  }
};

// Function to delete file
const deleteFile = async (fileName) => {
  try {
    await minioClient.removeObject(bucketName, fileName);
  } catch (error) {
    throw new Error(`MinIO delete failed: ${error.message}`);
  }
};

// Function to get file URL
const getFileUrl = (fileName) => {
  return `${BASE_URL}/${fileName}`;
};

module.exports = { minioClient, uploadFile, deleteFile, getFileUrl };