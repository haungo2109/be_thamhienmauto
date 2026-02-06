# Sử dụng image Node.js chính thức làm base image
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các phụ thuộc
# Sử dụng 'npm ci' cho môi trường production để đảm bảo tính nhất quán
RUN npm install --production

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose cổng mà ứng dụng sẽ chạy (trong app.js là 3001)
EXPOSE 3001

# Lệnh khởi chạy ứng dụng
CMD ["npm", "start"]
