const { Client } = require('minio');

const rustfsClient = new Client({
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
    await rustfsClient.putObject(bucketName, fileName, fileBuffer, {
      'Content-Type': mimeType
    });
    const url = `${BASE_URL}/${fileName}`;
    return url;
  } catch (error) {
    console.error("Chi tiết lỗi uploadFile:", JSON.stringify(error, null, 2));
    throw new Error(`RustFS upload failed: ${JSON.stringify(error, null, 2)}`);
  }
};

// Function to delete file
const deleteFile = async (fileName) => {
  try {
    const name = fileName.replace(`${BASE_URL}/`, '');
    await rustfsClient.removeObject(bucketName, name);
  } catch (error) {
    console.error("Chi tiết lỗi deleteFile:", JSON.stringify(error, null, 2));
    throw new Error(`RustFS delete failed: ${JSON.stringify(error, null, 2)}`);
  }
};

module.exports = { minioClient: rustfsClient, uploadFile, deleteFile };