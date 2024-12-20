import express from "express";
import Joi from "joi";
const router = express.Router(); // Sử dụng express.Router()
import order_controller from "../controllers/order_controller.js";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";

router.post('/orders/order_status', authenticateToken, authorizeRole(["user", "admin"]), order_controller.updateStatusOrder);


router.post('/orders', authenticateToken, authorizeRole(["user"]), order_controller.addOrder);

//get all
router.get('/orders/my_orders/:status', authenticateToken, authorizeRole(["user"]),order_controller.getMyOrdersByStatus);

//get order by id - user
router.get('/orders/:id', authenticateToken, authorizeRole(["user","admin"]), order_controller.findOrder);

//  Thống kê số lượng đơn hàng: Pending, Packing, Delivered trong 1 kết quả trả về 
router.get("/admin/orders/statistical", authenticateToken, authorizeRole(["admin"]), order_controller.adminStatisticalOrder);

//===========================
// 1. Get order by status
//========================
//Lấy tất cả order với trạng thái đơn hàng(order_statuses(status)) và phân trang(lấy thêm thông tin user[id, name] ứng với order đó) - role:admin
router.get("/admin/orders/:status", authenticateToken, authorizeRole(["admin"]), order_controller.adminGetOrdersByStatus);

router.get('/orders/statistical/:id',order_controller.statisticalPayment)

export default router;