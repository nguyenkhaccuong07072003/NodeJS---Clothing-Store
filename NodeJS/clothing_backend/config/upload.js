import multer from 'multer';
import path from 'path';

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Thư mục lưu trữ ảnh
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file với timestamp
    }
});

// Khởi tạo Multer với cấu hình lưu trữ
const upload = multer({ storage: storage });

export default upload;
