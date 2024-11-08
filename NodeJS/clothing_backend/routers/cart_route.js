import express from "express";
import Joi from "joi";
const router = express.Router(); // Sử dụng express.Router()
import { formatValidationError } from "../utils/exception.js";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import logger from "../utils/logger.js";
import Image from "../models/image_model.js";
import response_model from "../models/response/ResponseModel.js";
import cart_model from "../models/cart_model.js";
import cart_response from '../models/response/CartResponseModel.js'
import Models from "../models/response/ResponseModel.js";
import product_model from "../models/product_model.js";


router.get('/carts', authenticateToken, authorizeRole(["user"]), async (req, res, next) => {
    try {
        const user_id = req.user.id;
        logger.info("Fetching cart for user_id: " + user_id);

        // Tìm giỏ hàng cho người dùng và bao gồm CartItems, ProductDetails và Product
        const cart = await cart_model.Cart.findOne({
            where: { user_id },
            include: [
                {
                    model: cart_model.CartItem,
                    include: [
                        {
                            model: product_model.ProductDetails,
                            include: [
                                {
                                    model: product_model.Product // Bao gồm thông tin từ bảng Product
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!cart) {
            return res.status(200).json(new Models.ResponseModel(true, null, null));
        }

        // Tạo danh sách CartItemResponseModel từ cart_items
        const cartItems = cart.cart_items.map(cartItem => {
            const productDetails = cartItem.product_detail;
            const product = productDetails.product; // Lấy thông tin sản phẩm

            // Khởi tạo đối tượng CartItemResponseModel với thông tin sản phẩm
            return new cart_response.CartItemResponseModel(cartItem.id, product.id, cartItem.quantity, cartItem.color, cartItem.size, product.img_preview, product.name, productDetails.price);
        });

        // Khởi tạo đối tượng CartResponseModel
        const cartResponse = new cart_response.CartResponseModel(cart.id, cart.user_id, cartItems)


        // Trả về response dạng CartResponseModel
        return res.status(200).json(new Models.ResponseModel(true, null, cartResponse));
    } catch (error) {
        logger.error('Error fetching cart items:', error.message);
        const errorResponse = new Models.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching cart items', [error.message]);
        return res.status(500).json(new Models.ResponseModel(false, errorResponse));
    }
});


router.post('/cart', authenticateToken, authorizeRole(["user"]), async (req, res, next) => {
    const { product_details_id, quantity, color, size } = req.body;
    const user_id = req.user.id;
    logger.info("user_id request add cart: " + user_id);
    try {

        // Kiểm tra xem giỏ hàng của user đã tồn tại chưa
        let cart = await cart_model.Cart.findOne({ where: { user_id } });

        // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
        if (!cart) {
            cart = await cart_model.Cart.create({ user_id });
        }

        // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
        let cartItem = await cart_model.CartItem.findOne({
            where: {
                product_details_id: product_details_id,
                cart_id: cart.id,
                color: color,
                size: size
            }
        });

        if (cartItem) {
            // Nếu sản phẩm đã tồn tại, cập nhật số lượng
            cartItem = await cartItem.update({ quantity: cartItem.quantity + quantity });
        } else {
            // Nếu sản phẩm chưa tồn tại, tạo mới
            cartItem = await cart_model.CartItem.create({
                product_details_id: product_details_id,
                cart_id: cart.id,
                quantity: quantity,
                color: color,
                size: size
            });
        }

        return res.status(200).json(new Models.ResponseModel(true, null, cartItem));
    } catch (error) {
        logger.error('Error adding product to cart:', error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});


router.put('/cart/:id', authenticateToken, authorizeRole(["user"]), async (req, res, next) => {
    const { id } = req.params;
    const { quantity, color, size } = req.body;

    try {
        // Tìm kiếm item trong giỏ hàng dựa trên cartItemId
        let cartItem = await cart_model.CartItem.findOne({ where: { id: id } });

        // Nếu không tìm thấy item, trả về lỗi
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found!'
            });
        }

        // Cập nhật thông tin của sản phẩm trong giỏ hàng
        await cartItem.update({
            //Nếu không thay đổi thì giữ nguyên
            quantity: quantity || cartItem.quantity,
            color: color || cartItem.color,
            size: size || cartItem.size
        });

        return res.status(200).json(new Models.ResponseModel(true, null, cartItem));
    } catch (error) {
        const errorResponse = new Models.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching cart items', [error.message]);
        return res.status(500).json(new Models.ResponseModel(false, errorResponse));
    }
});

//Because method delete form resful api, so we will use post to receive array id cart
//I need to remove more cart
router.post('/carts/delete', authenticateToken, authorizeRole(["user"]), async (req, res, next) => {
    let { ids } = req.body;  // Nhận ids từ body, có thể là một số nguyên hoặc mảng các số nguyên

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Danh sách ID không hợp lệ' });
    }

    try {
        // Xóa tất cả các item tìm được
        await cart_model.CartItem.destroy({
            where: {
                id: ids,
            }
        });
        return res.status(200).json(new Models.ResponseModel(true, null, true));
    } catch (error) {
        const errorResponse = new Models.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching cart items', [error.message]);
        return res.status(500).json(new Models.ResponseModel(false, errorResponse));
    }
});


export default router;