import express from "express";
import Joi from "joi";
import { formatValidationError } from "../utils/exception.js";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import address_model from "../models/address_model.js";
import logger from "../utils/logger.js";
import response_model from '../models/response/ResponseModel.js'

const add_new_delivery = Joi.object({
    province_id: Joi.string().required().messages({
        "any.required": "Tên người dùng là bắt buộc",
        "string.base": "Tên người dùng phải là chuỗi ký tự"
    }),

    district_id: Joi.string().required().messages({
        "any.required": "district_id là bắt buộc",
        "string.base": "district_id required"
    }),
    ward_id: Joi.string().required().messages({
        "any.required": "ward_id là bắt buộc",
        "string.base": "ward_id phải là chuỗi ký tự"
    }),
    number_phone: Joi.string().required().messages({
        "any.required": "number_phone là bắt buộc",
        "string.base": "number_phone phải là chuỗi ký tự"
    }),
    details: Joi.string().required().messages({
        "any.required": "details là bắt buộc",
        "string.base": "details phải là chuỗi ký tự"
    }),
    full_name: Joi.string().required().messages({
        "any.required": "full_name là bắt buộc",
        "string.base": "full_name phải là chuỗi ký tự"
    }),
    is_default: Joi.bool().optional(),
    id: Joi.string().allow(null, '').optional().empty(true)

});


const getProvinces = async (req, res, next) => {
    try {
        logger.info("=======> GET ALL PROVINCES <=============")
        var provices = await address_model.Province.findAll();
        return res.status(200).json(new response_model.ResponseModel(true, null, provices));
    } catch (error) {
        logger.error('Error fetching cart items:', error.message);
        const errorResponse = new response_model.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching address', [error.message]);
        return res.status(500).json(new response_model.ResponseModel(false, errorResponse));
    }
};

//Get district by qery, query start with ?
const getDistrictByProviceId = async (req, res) => {
    try {
        const province_id = req.query.id;
        logger.info(`=======> GET ALL DISTRICTS - ${province_id}  <=============`)
        const districts = await address_model.District.findAll({
            where: {
                parent_code: province_id
            }
        });
        return res.status(200).json(new response_model.ResponseModel(true, null, districts));
    } catch (error) {
        logger.error('Error fetching cart items:', error.message);
        const errorResponse = new response_model.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching address', [error.message]);
        return res.status(500).json(new response_model.ResponseModel(false, errorResponse));
    }
};

//Get wards by district id
const getWardsByDistrictID = async (req, res) => {
    try {
        const district_id = req.query.id;
        const wards = await address_model.Ward.findAll({
            where: {
                parent_code: district_id
            }
        });
        return res.status(200).json(new response_model.ResponseModel(true, null, wards));
    } catch (error) {
        logger.error('Error fetching cart items:', error.message);
        const errorResponse = new response_model.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching address', [error.message]);
        return res.status(500).json(new response_model.ResponseModel(false, errorResponse));
    }
};

//Thêm địa chỉ giao hàng
const addDelivery = async (req, res) => {
    const { error } = add_new_delivery.validate(req.body);

    if (error) {
        const formattedErrors = formatValidationError(error.details);
        return res.status(400).json(new response_model.ResponseModel(false, new response_model.ErrorResponseModel(1, "Validation Error", formattedErrors), null));
    }

    try {
        const user_id = req.user.id;
        const { province_id, district_id, ward_id, number_phone, full_name, is_default, details } = req.body;
        const address = await address_model.DeliveryInformation.create({
            province_id: province_id,
            district_id: district_id,
            ward_id: ward_id,
            number_phone: number_phone,
            full_name: full_name,
            is_default: is_default,
            user_id: user_id,
            details: details
        });

        return res.status(200).json(new response_model.ResponseModel(true, null, address));
    } catch (error) {
        const errorResponse = new response_model.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching address', [error.message]);
        return res.status(500).json(new response_model.ResponseModel(false, errorResponse));
    }
};

//Cập nhật địa chỉ giao hàng
const updateDelivery = async (req, res) => {
    const addressId = req.query.id;
    const { province_id, district_id, ward_id, number_phone, full_name, is_default, details } = req.body;

    try{
        let address = await address_model.DeliveryInformation.findOne({ where: { id: addressId } });

    // Nếu không tìm thấy item, trả về lỗi
    if (!address) {
        return res.status(404).json({
            success: false,
            message: 'address not found!'
        });
    }

    // Cập nhật thông tin của sản phẩm trong giỏ hàng
    await address.update({
        province_id: province_id,
        district_id: district_id,
        ward_id: ward_id,
        number_phone: number_phone,
        full_name: full_name,
        is_default: is_default,
        details: details
    });

    return res.status(200).json(new response_model.ResponseModel(true, null, address));
    }catch (error) {
        const errorResponse = new response_model.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching address', [error.message]);
        return res.status(500).json(new response_model.ResponseModel(false, errorResponse));
    }
}

//Lấy địa chỉ giao hàng
const getDelivery = async (req, res) => {
    try {
        const user_id = req.user.id;
        const addresses = await address_model.DeliveryInformation.findAll({
            where: {
                user_id: user_id
            }
        })
        return res.status(200).json(new response_model.ResponseModel(true, null, addresses));
    } catch (error) {
        const errorResponse = new response_model.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching address', [error.message]);
        return res.status(500).json(new response_model.ResponseModel(false, errorResponse));
    }
};


const deleteDelivery = async (req, res, next) => {
    let id = req.query.id;

    if (!id) {
        return res.status(400).json({ error: 'Danh sách ID không hợp lệ' });
    }
    try {
        // Xóa tất cả các item tìm được
        await address_model.DeliveryInformation.destroy({
            where: {
                id: id,
            }
        });
        return res.status(200).json(new response_model.ResponseModel(true, null, true));
    } catch (error) {
        const errorResponse = new response_model.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching cart items', [error.message]);
        return res.status(500).json(new response_model.ResponseModel(false, errorResponse));
    }
};

export default { getProvinces, getDistrictByProviceId, getWardsByDistrictID, addDelivery, getDelivery , updateDelivery, deleteDelivery}