import pino from 'pino';

// Tạo một logger với các cấu hình mặc định
const logger = pino({
  level: 'info', // Mức log mặc định là 'info'
  transport: {
    target: 'pino-pretty', // Sử dụng 'pino-pretty' để định dạng log cho dễ đọc
    options: {
      colorize: true, // Màu sắc cho các loại log khác nhau
      levelFirst: true, // Hiển thị mức độ log trước tiên
      translateTime: true // Hiển thị thời gian một cách dễ đọc
    }
  }
});

export default logger;
