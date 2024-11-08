import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Models from '../models/response/ResponseModel.js';
import logger from '../utils/logger.js';
import User from '../models/user_model.js';

dotenv.config();

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return  res.status(401).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Unauthorized", null), null));
    }

    jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
        if (err) {
            return  res.status(401).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Unauthorized", null), null));
        }
         // Lấy email từ token đã được xác thực và giải mã
         const userEmail = user.email;

         // Truy vấn database để lấy người dùng dựa trên email
         const userFind = await User.findOne({ where: { email: userEmail } });

         // Nếu không tìm thấy người dùng, trả về lỗi
         if (!userFind) {
             return res.status(403).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Người dùng không tồn tại", null), null));
         }

        req.user = userFind;
        next();
    });
};

export const authorizeRole = (requiredRoles) => {
    return async (req, res, next) => {
        try {
           
            const user = req.user;
            // Lấy tất cả các quyền (roles) của người dùng từ database
            const userRoles = await user.getRoles(); // giả sử bạn có quan hệ giữa User và Role

            // Chuyển đổi userRoles sang mảng chứa các tên quyền
            const roleNames = userRoles.map(role => role.name);

            logger.info("User roles from DB: " + roleNames + " - Required roles: " + requiredRoles);

            // Kiểm tra nếu có ít nhất một quyền của user trùng với quyền yêu cầu
            const hasPermission = roleNames.some(role => requiredRoles.includes(role));

            if (!hasPermission) {
                return res.status(403).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Bạn không có quyền truy cập", null), null));
            }

            // Nếu hợp lệ, tiếp tục xử lý request
            req.user = user;
            next();
        } catch (error) {
            logger.error("Error in authorizeRole middleware:", error);
            return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
        }
    };
};

