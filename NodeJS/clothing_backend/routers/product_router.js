import express from "express";
import Joi from "joi";
const router = express.Router(); // Sử dụng express.Router()
import { formatValidationError } from "../utils/exception.js";
import Category from "../models/category_model.js";
import product_model from "../models/product_model.js";
import upload from "../config/upload.js";
import Models from "../models/response/ResponseModel.js";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import logger from "../utils/logger.js";
import sequelize from '../connection/mysql.js';

const addCategory = Joi.object({
    category_name: Joi.string().required().messages({
        "any.required": "Tên danh mục là bắt buộc",
        "string.base": "Tên danh mục phải là chuỗi ký tự",
    }),
    is_public: Joi.boolean().required().messages({
        "any.required": "is_public là bắt buộc",
        "string.base": "is_public phải là true hoặc false",
    }),
});

const updateCategory = Joi.object({
    category_name: Joi.string().optional().messages({
        "string.base": "Tên danh mục phải là chuỗi ký tự",
    }),
    is_public: Joi.boolean().optional().messages({
        "boolean.base": "is_public phải là true hoặc false",
    }),
});

//search product by like name
router.get("/products_by_name", authenticateToken, authorizeRole(["admin", "user"]), async (req,res,next)=>{
    try {
        const searchQuery = req.query.name;

        if (!searchQuery || searchQuery.trim() === "") {
            return res.status(400).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(2, "Thiếu từ khóa tìm kiếm", null), null));
        }

        const query = `SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)`;
        const replacements = [`%${searchQuery}%`];
        const products = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
        });

        return res.status(200).json(new Models.ResponseModel(true, null, products));
    } catch (error) {
        next(error); // Gọi next để truyền lỗi cho middleware xử lý lỗi
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

//get all
//Need to get with condition is_public = true, and sort by rate
router.get("/products", async (req, res, next) => {
    const products = await product_model.Product.findAll({
        where: {
            is_public: true,
        },
        order: [["rate", "DESC"]],
    });
});

//find product by id - return additional details
router.put("products/:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        logger.info("id = "+id);
        const product = await product_model.Product.findByPk(req.params.id);
    } catch (error) {
        // handle exception
    }
});

//Find product details
router.get('/products/:id/details', async (req,res,next)=>{
    try {
        const id = req.params.id;
        logger.info("id = "+id);
        const product = await product_model.Product.findByPk(id, {
            include: [{
                model: product_model.ProductDetails, // Adjust to your actual model name
                as: 'product_details' // Make sure this alias matches your association
            }]
        });

        if (!product) {
            return res.status(404).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(2, "Product not found", null), null));
        }
       
        return res.status(200).json(new Models.ResponseModel(true, null, product.product_details));
    } catch (error) {
        logger.error("Error fetching products details:", error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

//Pagination
router.get("/p", async (req, res, next) => {
    const limit = req.body.limit;
    const offset = req.body.offset;

    const products = await User.findAll({
        limit: limit,
        offset: offset,
    });
});

//Update
router.put("/:id",authenticateToken,authorizeRole(["admin"]),async (req, res, next) => { }
);

//Add new
//Need to check Joi
router.post("/", authenticateToken,authorizeRole(["admin"]),upload.array("images", 10),async (req, res, next) => 
{
    try {
            const { name, description, price } = req.body;
            const images = req.files.map((file) => file.filename);
        } catch (error) {
            // handle
        }
});

//------------------------ CATEGORY -----------------------------------------------------------------

//get all category
router.get("/categories/", async (req,res,next)=>{
    const data = req.body.data;
    try{
        const categories = await Category.findAll();
        return res.status(200).json(new Models.ResponseModel(true, null, categories));
    } catch (error) {
        logger.error("Error fetching categories:", error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

router.get("/categories/:id/products", async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const limit = parseInt(req.query.limit) || 20; 
        const offset = parseInt(req.query.offset) || 0; 

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Category not found", null), null));
        }

        // Lấy danh sách sản phẩm thuộc về danh mục này với phân trang
        const products = await product_model.Product.findAll({
            include: {
                model: Category,
                through: { attributes: [] }, // Loại bỏ các thuộc tính của bảng trung gian
                where: { id: categoryId },
            },
            limit: limit,
            offset: offset,
        });

        return res.json(new Models.ResponseModel(true, null, products));
    } catch (error) {
        logger.error("Error fetching products:", error);
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", error.message), null));
    }
});

router.post("/category",authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
    const { error } = addCategory.validate(req.body);
    if (error) {
        const formattedErrors = formatValidationError(error.details);
        return res.status(400).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1,"Validation Error",formattedErrors ),null));
        }
        try {
            const existingCategory = await Category.findOne({
                where: {
                    category_name: req.body.category_name,
                },
            });
            if (existingCategory) {
                return res.status(409).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1, "Danh mục đã tồn tại", null),null));
            } else {
                if (!req.body.category_name || req.body.category_name.trim() === "") {
                    return res.status(400).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1,"Tên danh mục không hợp lệ",null),null));
                } else {
                    const newCategory = new Category({
                        category_name: req.body.category_name,
                        is_public:
                            req.body.is_public === "true" || req.body.is_public === true,
                    });
                    const savedCategory = await newCategory.save();
                    return res.status(201).json(new Models.ResponseModel( true, { message: "Thêm danh mục thành công" },savedCategory));
                }
            }
        } catch (err) {
            return res.status(500).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1, "Lỗi hệ thống", err.message), null));
        }
    }
);

router.put("/category/:id", authenticateToken, authorizeRole(["admin"]),async (req, res) => {
        // Xác thực dữ liệu đầu vào
        const { error } = updateCategory.validate(req.body);
        if (error) {
            const formattedErrors = formatValidationError(error.details);
            return res.status(400).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1,"Validation Error",formattedErrors),null));
        }

        try {
            const categoryId = req.params.id;
            const category_name = req.body.category_name;

            // Kiểm tra danh mục có tồn tại hay không
            const existingCategory = await Category.findOne({
                where: { id: categoryId },
            });
            if (!existingCategory) {
                return res.status(404).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1, "Danh mục không tồn tại", null),null));
            }

            // Lấy tất cả danh mục và kiểm tra trùng lặp
            const categories = await Category.findAll();
            const isDuplicate = categories.some(
                (category) =>
                    category.category_name === category_name && category.id !== categoryId
            );

            if (isDuplicate) {
                return res
                    .status(409).json(new Models.ResponseModel( false,new Models.ErrorResponseModel(1, "Danh mục đã tồn tại", null),null));
            }

            // Cập nhật danh mục
            const [_, updatedCategories] = await Category.update(req.body, {
                where: { id: categoryId },
                returning: true, // Để trả về bản ghi đã cập nhật
            });

            // Trả về bản ghi đã cập nhật
            return res.status(200).json(new Models.ResponseModel(true,{ message: "Sửa danh mục thành công" },updatedCategories[0]));
        } catch (err) {
            return res.status(500).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1, "Lỗi hệ thống", err.message),null));
        }
    }
);

router.delete("/category/:id",authenticateToken,authorizeRole(["admin"]), async (req, res) => {
        try {
            const categoryId = req.params.id;

            // Kiểm tra danh mục có tồn tại hay không
            const existingCategory = await Category.findByPk(categoryId);
            if (!existingCategory) {
                return res.status(404).json(new Models.ResponseModel( false,new Models.ErrorResponseModel(1, "Danh mục không tồn tại", null),null));
            }

            // Xóa danh mục
            await Category.destroy({ where: { id: categoryId } });

            return res.status(200).json(new Models.ResponseModel(true, null,"Danh mục đã được xóa thành công"));
        } catch (err) {
            return res.status(500).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1, "Lỗi hệ thống", err.message),null));
        }
    }
);

export default router;
