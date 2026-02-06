# BE_ThamHienMauTo

A Node.js Express.js application.

## Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.

## Usage

Run `npm start` to start the server.

## Docker Deployment

Để triển khai ứng dụng bằng Docker trên VPS, làm theo các bước sau:

1.  **Cài đặt Docker và Docker Compose** trên VPS của bạn.
2.  **Sao chép mã nguồn** lên VPS.
3.  **Cấu hình biến môi trường**:
    -   Tạo file `.env` từ `.env.example`: `cp .env.example .env`
    -   Chỉnh sửa file `.env` với các thông tin thực tế của bạn (đặc biệt là `JWT_SECRET`).
4.  **Khởi chạy với Docker Compose**:
    ```bash
    docker-compose up -d --build
    ```
5.  **Kiểm tra trạng thái**:
    ```bash
    docker-compose ps
    ```

Ứng dụng sẽ tự động khởi tạo database PostgreSQL từ file `postgres_cms_ecommerce.sql` trong lần chạy đầu tiên.

## Project Structure

- `app.js`: Main application file
- `routes/`: Route handlers
- `controllers/`: Business logic
- `models/`: Data models
- `middleware/`: Custom middleware
- `config/`: Configuration files
- `public/`: Static files
- `tests/`: Test files