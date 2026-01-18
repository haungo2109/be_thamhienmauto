const { Client } = require('minio');

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: process.env.MINIO_REGION
});

const bucketName = process.env.MINIO_BUCKET;

// Function to upload file
const uploadFile = async (fileName, fileBuffer, mimeType) => {
  try {
    await minioClient.putObject(bucketName, fileName, fileBuffer, {
      'Content-Type': mimeType
    });
    const url = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}/${bucketName}/${fileName}`;
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
  return `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}/${bucketName}/${fileName}`;
};

module.exports = { minioClient, uploadFile, deleteFile, getFileUrl };