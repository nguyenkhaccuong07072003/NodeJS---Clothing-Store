import express from "express";
import Joi from "joi";
const router = express.Router(); // Sử dụng express.Router()
import { formatValidationError } from "../utils/exception.js";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import logger from "../utils/logger.js";
import voucher_model from "../models/voucher_model.js";
import Models from "../models/response/ResponseModel.js";
import User from "../models/user_model.js";

import sequelize from '../connection/mysql.js';
import Voucher from "../models/voucher_model.js";
import { or, QueryTypes,Op, Sequelize } from "sequelize";
// get all voucher by user_id (phân trang - user) - lấy các voucher có thời hạn(start_at <= current_date <= end_at), is_public = true

/*
1. Select with condition: [ is_public = true ,(start_at <= current_date <= end_at), quantity > 0 , user_id = seft or null ]
2. Cần kiểm tra order nào đã sử dụng voucher chưa, hoặc nếu sử dụng rồi nhưng đã hủy hàng vẫn lấy ra
3. Đảm bảo quá trình truy vấn không tốn tài nguyên với hệ thống lớn, nghĩ sẽ cần truy vấn với điều kiện order nằm trong phạm vi của voucher
*/
router.get('/vouchers', authenticateToken, authorizeRole(["user"]), async (req, res, next) => {
    try {
        const user_id = req.user.id;
       logger.info(`user ${user_id} request get vouchers`)


        const vouchers = await sequelize.query(`
    SELECT v.* 
    FROM vouchers v
    LEFT JOIN orders o ON v.id = o.voucher_id
    LEFT JOIN order_statuses os ON o.id = os.order_id AND os.status = 'CANCELED'
    WHERE v.is_public = true
      AND v.start_at <= NOW()
      AND v.end_at >= NOW()
      AND (v.quantity - v.used) > 0
      AND (
          v.user_id IS NULL OR v.user_id = :user_id
      )
      AND (
          o.id IS NULL OR (o.order_date BETWEEN v.start_at AND v.end_at AND os.status = 'CANCELED')
      );
`, {
            replacements: {
                user_id: user_id,
            },
            type: QueryTypes.SELECT,
        });

        return res.status(200).json(new Models.ResponseModel(true, null, vouchers));

    } catch (error) {
        logger.error('Error fetching user vouchers:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});



// find voucher by id (user - admin) lấy is_public = true 
router.get('/vouchers/:id', authenticateToken, authorizeRole(["user", "admin"]), async (req, res, next) => {
    try {
        const voucher_id = req.params.id;

        const voucher = await Voucher.findOne({
            where: { id: voucher_id, is_public: true },

        });

        // Kiểm tra xem voucher có tồn tại không
        if (!voucher) {
            return res.status(404).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(2, "Voucher không tồn tại", null), null));
        }

        return res.status(200).json(new Models.ResponseModel(true, null, voucher));
    } catch (error) {
        logger.error('Error fetching voucher by id:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});


/*
1. user_id = array
2. condition = enum (all, new_user, Only)
 - If user_id.lenght  <= 0 => user_id = null, condition = all
 - Else user_id = user_id[index], condition = only
*/
router.post('/vouchers', authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
    try {
        const {
            title,
            description,
            discount,
            type,
            start_at,
            end_at,
            is_public,
            user_id = null, // Mặc định là null nếu không được truyền
            quantity = 1,
        } = req.body;


        // Kiểm tra nếu có user_id được chỉ định
        if (user_id) {
            const user = await User.findByPk(user_id);
            if (!user) {
                return res.status(404).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Người dùng không tồn tại", null), null));
            }
        }

        // Tạo voucher mới
        const voucher = await Voucher.create({
            title,
            description,
            discount,
            type,
            start_at,
            end_at,
            is_public,
            quantity: user_id ? 1 : quantity,
            user_id: user_id,
            used: 0
        });

        return res.status(200).json(new Models.ResponseModel(true, null, voucher));
    } catch (error) {
        logger.error('Error adding voucher:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

router.put('/voucher/:id', authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, discount, type, start_at, end_at, is_public, user_id } = req.body;

        // Tìm voucher theo id
        let voucher = await voucher_model.Voucher.findByPk(id);
        if (!voucher) {
            return res.status(404).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(2, "Voucher không tồn tại", null), null));
        }

        // Cập nhật thông tin voucher
        voucher.title = title || voucher.title;
        voucher.description = description || voucher.description;
        voucher.discount = discount || voucher.discount;
        voucher.type = type || voucher.type;
        voucher.start_at = start_at || voucher.start_at;
        voucher.end_at = end_at || voucher.end_at;
        voucher.is_public = is_public !== undefined ? is_public : voucher.is_public;
        voucher.user_id = user_id;

        // Lưu thay đổi
        await voucher.save();

        if (user_id) {
            const user = await User.findByPk(user_id);
            if (!user) {
                return res.status(404).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(3, "User không tồn tại", null), null));
            }

            // Xóa liên kết hiện tại và thêm liên kết với user mới
            await voucher.setUsers([user]);
        }

        return res.status(200).json(new Models.ResponseModel(true, null, voucher));
    } catch (error) {
        logger.error('Error updating voucher:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

export default router;