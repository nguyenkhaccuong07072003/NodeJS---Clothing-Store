import express from "express";
const router = express.Router(); // Sử dụng express.Router()
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import cartController from '../controllers/cart_controller.js'


router.get('/carts', authenticateToken, authorizeRole(["user"]), cartController.getCarts);

router.post('/cart', authenticateToken, authorizeRole(["user"]), cartController.addToCart);

router.put('/cart/:id', authenticateToken, authorizeRole(["user"]), cartController.updateCartByID);

router.post('/carts/delete', authenticateToken, authorizeRole(["user"]), cartController.deleteCarts);


export default router;