import express from "express";
import Joi from "joi";
const router = express.Router(); // Sử dụng express.Router()
import { formatValidationError } from "../utils/exception.js";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import logger from "../utils/logger.js";
import Voucher from "../models/voucher_model.js";
import Models from "../models/response/ResponseModel.js";
import User from "../models/user_model.js";
import { Op } from 'sequelize';

//test - ok
//get all voucher (phân trang - admin) 
router.get('/vouchers',authenticateToken, authorizeRole(["admin"]), async (req, res, next) =>{
    try{
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 20; 
        const offset = (page - 1) * limit;
    
        // Lấy tất cả vouchers với phân trang và sắp xếp theo ngày tạo mới nhất
        const { count, rows } = await Voucher.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']], 
        });    
        const totalPages = Math.ceil(count / limit);
        return res.status(200).json(new Models.ResponseModel(true, null, {
            vouchers: rows,
            pagination: {
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        }));
    } catch (error) {
    logger.error('Error fetching vouchers:', error);
    return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});


// get all voucher by user_id (phân trang - user) - lấy các voucher có thời hạn(start_at <= current_date <= end_at), is_public = true
router.get('/vouchers/my_voucher',authenticateToken, authorizeRole(["user"]), async (req, res, next)=>{
    try{
        const user_id = req.user.id;  
        const currentDate = new Date(); 
        const vouchers = await Voucher.findAll({
            include: [{
                model: User,
                where: { id: user_id },
                attributes: [] 
            }],
            where: {
                is_public: true,
                startAt: { [Op.lte]: currentDate },  // Sửa: So sánh ngày bắt đầu nhỏ hơn hoặc bằng hiện tại
                endAt: { [Op.gte]: currentDate }     // Sửa: So sánh ngày kết thúc lớn hơn hoặc bằng hiện tại
            },
        });

    
        return res.status(200).json(new Models.ResponseModel(true, null, vouchers));

    
    } catch (error) {
        logger.error('Error fetching user vouchers:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});




// find voucher by id (user - admin) lấy is_public = true 
router.get('/voucher/:id', authenticateToken, authorizeRole(["user", "admin"]), async (req, res, next) => {
    try {
        const voucher_id = req.params.id;
        console.log("Voucher ID:", voucher_id);

        const voucher = await Voucher.findOne({
            where: {id: voucher_id, is_public: true},
            include: [{
                model: User,
                through: { attributes: [] }, // Không hiển thị thông tin của user
                attributes: [] // Ẩn tất cả thông tin của user
            }]
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


//User_id is array
router.post('/voucher', authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
    try {
        const { title, description, discount, type, start_at, end_at, is_public, user_id } = req.body;

        // Tạo voucher mới
        const voucher = await Voucher.create({
            title,
            description,
            discount,
            type,
            start_at,
            end_at,
            is_public,
        });

        // Kiểm tra nếu có user_id được chỉ định
        if (user_id && user_id.length > 0) {
            // Gán voucher cho các user được chỉ định
            const users = await User.findAll({
                where: {
                    id: user_id, // Lọc theo danh sách user_id
                }
            });

            if (users.length === 0) {
                return res.json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "No users found with provided IDs", null), null));
            }

            // Gán voucher cho tất cả người dùng chỉ định
            await Promise.all(users.map(user => user.addVoucher(voucher)));

        } else {
            // Nếu user_id rỗng, gán voucher cho tất cả người dùng
            const allUsers = await User.findAll(); // Lấy tất cả người dùng

            await Promise.all(allUsers.map(user => user.addVoucher(voucher)));
        }

        return res.status(200).json(new Models.ResponseModel(true, null, voucher));

    } catch (error) {
        logger.error('Error adding voucher:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

router.put('/voucher/:id',authenticateToken, authorizeRole(["admin"]),  async (req, res, next) => {
    try {
        const { id } = req.params;  
        const { title, description, discount, type, start_at, end_at, is_public ,user_id} = req.body;

        // Tìm voucher theo id
        let voucher = await Voucher.findByPk(id);
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