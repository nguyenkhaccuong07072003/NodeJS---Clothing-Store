import express from "express";
import Joi from "joi";
const router = express.Router(); // Sử dụng express.Router()
import { formatValidationError } from "../utils/exception.js";
import logger from "../utils/logger.js";
import Image from "../models/image_model.js";
import Models from "../models/response/ResponseModel.js";

const getImageByModel = Joi.object({
    model_name: Joi.string().required().messages({
        "any.required": "model_name là bắt buộc",
        "string.base": "model_name phải là chuỗi ký tự",
    }),
    model_id: Joi.string().required().messages({
        "any.required": "model_id là bắt buộc",
        "string.base": "model_id phải là chuỗi kí tự",
    }),
});

//Get image
router.get('/images', async (req,res,next)=>{
    const { error } = getImageByModel.validate(req.query);
    if (error) {
        const formattedErrors = formatValidationError(error.details);
        return res.status(400).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1,"Validation Error",formattedErrors ),null));
        }
        try {
            const { model_name, model_id } = req.query;
            const images = await Image.findAll({
                where: {
                    model_name: model_name,
                    model_id: model_id
                }
            });
    
            if (images.length > 0) {
                return res.status(200).json(new Models.ResponseModel(true, null, images));
            } else {
                return res.status(404).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "No images found"), null));
            }
           
        } catch (err) {
            logger.error("Error fetching images:", err);
            return res.status(500).json(new Models.ResponseModel(false,new Models.ErrorResponseModel(1, "Lỗi hệ thống", err.message), null));
        }
});


export default router;