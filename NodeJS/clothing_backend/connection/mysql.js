import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // Nạp các biến môi trường từ file .env

// Khởi tạo kết nối Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql', // Sử dụng MySQL
  port: process.env.DB_PORT || 3306,
  logging: true // Tắt log SQL trong console
});



// Sử dụng export default
export default sequelize;
