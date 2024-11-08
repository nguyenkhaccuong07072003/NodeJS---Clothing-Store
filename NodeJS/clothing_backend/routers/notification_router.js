import express from "express";
import Joi from "joi";
const router = express.Router(); // Sử dụng express.Router()
import { formatValidationError } from "../utils/exception.js";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import logger from "../utils/logger.js";
import Models from "../models/response/ResponseModel.js";
import Notification from "../models/notification_model.js";

//get all notification by user_id
router.get('/notifications', authenticateToken, authorizeRole(["user"]), async (req,res,next)=>{
    try{
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']], 
        });
        return res.status(200).json(new Models.ResponseModel(true, null, notifications));
    }catch (error) {
        logger.error('Error fetching notifications:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

router.put('/notification/:id', authenticateToken, authorizeRole(["admin"]),async (req,res,next)=>{
    try{
        const notificationId = req.params.id;
        const { title, content, type, is_action, is_read } = req.body;

        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(2, "Notification không tồn tại", null), null));
        }
        await notification.update({
            is_read: is_read !== undefined ? is_read : notification.is_read 
        });
        return res.status(200).json(new Models.ResponseModel(true, null, notification));
    }
catch (error) {
        logger.error('Error updating notification:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});


export default router;