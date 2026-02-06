const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  dialect: 'postgres',
  ssl: process.env.PGSSLMODE === 'require',
  logging: false,
  dialectOptions: {
    keepAlive: true, 
  },
  pool: {
    max: 5,        // Số kết nối tối đa
    min: 0,
    acquire: 30000, // Thời gian tối đa để thử kết nối (ms)
    idle: 10000     // Nếu kết nối rảnh quá 10s thì ngắt đi, đừng giữ
  },
  define: {
    timestamps: true
  },
});

module.exports = { sequelize };
