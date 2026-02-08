const { Client } = require('minio');

// 1. Xử lý Port và SSL linh hoạt
const useSSL = process.env.RUSTFS_USE_SSL === 'true';
// Nếu có biến ENV Port thì dùng, nếu không thì tự suy ra (443 cho https, 80 cho http)
const port = process.env.RUSTFS_PORT ? parseInt(process.env.RUSTFS_PORT, 10) : (useSSL ? 443 : 80);
const endPoint = process.env.RUSTFS_ENDPOINT; // Lưu ý: Chỉ điền tên host/domain, KHÔNG có http://

console.log(`Kết nối RustFS với endPoint: ${endPoint}, port: ${port}, useSSL: ${useSSL}`);

const rustfsClient = new Client({
  endPoint: endPoint,
  port: port,          // Cực kỳ quan trọng để chạy trong Docker
  useSSL: useSSL,
  accessKey: process.env.RUSTFS_ACCESS_KEY,
  secretKey: process.env.RUSTFS_SECRET_KEY,
  region: process.env.RUSTFS_REGION
});

const bucketName = process.env.RUSTFS_BUCKET;

// 2. Xử lý BASE_URL (URL trả về cho người dùng truy cập)
// Mẹo: Nếu bạn muốn link ảnh trả về là domain công khai (public) thay vì link nội bộ (internal docker)
// Bạn nên thêm 1 biến RUSTFS_PUBLIC_DOMAIN. Nếu không có thì dùng logic mặc định bên dưới.
const publicDomain = process.env.RUSTFS_PUBLIC_DOMAIN; 

let BASE_URL;
if (publicDomain) {
    // Ưu tiên dùng domain public nếu có cấu hình (Dành cho Product)
    BASE_URL = `${publicDomain}/${bucketName}`;
} else {
    // Fallback về logic cũ (Dành cho Dev/Local)
    const protocol = useSSL ? 'https' : 'http';
    const portString = (port === 80 || port === 443) ? '' : `:${port}`;
    BASE_URL = `${protocol}://${endPoint}${portString}/${bucketName}`;
}

// Function to upload file
const uploadFile = async (fileName, fileBuffer, mimeType) => {
  try {
    await rustfsClient.putObject(bucketName, fileName, fileBuffer, {
      'Content-Type': mimeType
    });
    
    // Trả về URL đầy đủ
    return `${BASE_URL}/${fileName}`;
  } catch (error) {
    console.error("Chi tiết lỗi uploadFile:", JSON.stringify(error, null, 2));
    throw new Error(`RustFS upload failed: ${error.message}`);
  }
};

// Function to delete file
const deleteFile = async (fileName) => {
  try {
    // Lấy tên file gốc từ URL
    const name = fileName.replace(`${BASE_URL}/`, '');
    await rustfsClient.removeObject(bucketName, name);
  } catch (error) {
    console.error("Chi tiết lỗi deleteFile:", JSON.stringify(error, null, 2));
    throw new Error(`RustFS delete failed: ${error.message}`);
  }
};

module.exports = { minioClient: rustfsClient, uploadFile, deleteFile };