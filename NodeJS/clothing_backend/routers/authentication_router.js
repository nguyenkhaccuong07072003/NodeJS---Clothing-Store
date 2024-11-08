
import express from 'express';
import jwt from 'jsonwebtoken'; // Thay vì require
import bcrypt from 'bcrypt'; // Thay vì require
import Joi from 'joi';
const router = express.Router(); // Sử dụng express.Router()
import User from '../models/user_model.js';
import { formatValidationError } from '../utils/exception.js'

import dotenv from 'dotenv';
import Models from '../models/response/ResponseModel.js';
import logger from '../utils/logger.js';
import LoginResponse from '../models/response/LoginResponse.js';
import LogLogin from '../models/log_login.js';
import permission_role from '../models/permission_model.js'

dotenv.config();

//docs: https://github.com/jquense/yup

//Need to fcm_token, because we want to notice to all user registed
// device_id: unique id of device, use to session login manager
const loginRequest = Joi.object({
    email: Joi.string().email().required().messages({
        "any.required": "Tên người dùng là bắt buộc",
        "string.base": "Tên người dùng phải là chuỗi ký tự"
    }),
    password: Joi.string().required().messages({
        "any.required": "Mật khẩu là bắt buộc",
        "string.base": "Mật khẩu phải là chuỗi ký tự"
    }),
    fcm_token: Joi.string().required().messages({
        "any.required": "FCM_Token là bắt buộc",
        "string.base": "FCM_Token phải là chuỗi ký tự"
    }),
    device_id: Joi.string().required().messages({
        "any.required": "device_id là bắt buộc",
        "string.base": "device_id phải là chuỗi ký tự"
    })
});


const registerRequest = Joi.object({
    email: Joi.string().email().required().messages({
        "any.required": "Tên người dùng là bắt buộc",
        "string.base": "Tên người dùng phải là chuỗi ký tự"
    }),
    password: Joi.string().required().messages({
        "any.required": "Mật khẩu là bắt buộc",
        "string.base": "Mật khẩu phải là chuỗi ký tự"
    }),
    full_name: Joi.string().required().messages({
        "any.required": "Mật khẩu là bắt buộc",
        "string.base": "Mật khẩu phải là chuỗi ký tự"
    }),


});

const login_google_request = Joi.object({
    email: Joi.string().email().required().messages({
        "any.required": "Tên người dùng là bắt buộc",
        "string.base": "Tên người dùng phải là chuỗi ký tự"
    }),
    password: Joi.string().optional(),
    full_name: Joi.string().optional(),
    fcm_token: Joi.string().required().messages({
        "any.required": "fcm_token là bắt buộc",
        "string.base": "use for notification"
    }),
    device_id: Joi.string().required().messages({
        "any.required": "device_id là bắt buộc",
        "string.base": "device_id phải là chuỗi ký tự"
    }),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    avatar: Joi.string().optional(),
    number_phone: Joi.string().optional()

});


//log_login : id, user_id, device_id, fcm_token, time_login


// use post to hash data in request
// Step 1: hash password and compare to password in database
// Step 2: IF password incorrect return message,else transfer step 3
// Step 3: Check user is_active => callback if is not active
// Step 4: Get token (jsonwebtoken) 
// Step 5: we need to add infor login on database
// Step 6: return reponse with info user and token

router.post('/login', async (req, res, next) => {

    const { error } = await loginRequest.validate(req.body);
    if (error) {
        const formattedErrors = formatValidationError(error.details);
        return res.json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Validation Error", formattedErrors), null));
    }
    try {
        const { email, password, device_id, fcm_token } = req.body;
        // Tìm người dùng dựa trên user_name
        const user = await User.findOne({ where: { email } });
        

        if (!user) {
            return res.json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Người dùng không tồn tại", null), null));
        }
        // So sánh mật khẩu đã nhập với chuỗi hash lấy từ cơ sở dữ liệu
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {

            LogLogin.create({
                device_id: device_id,
                fcm_token: fcm_token,
                time_login: new Date(),
                user_id : user.id
            });

            //Get roles
            const roles = await user.getRoles();
            const roleNames = roles.map(role => role.name);
            const token = jwt.sign({ email: user.email, roles: roleNames }, process.env.TOKEN_SECRET, { expiresIn: '5d' });
            const userWithRoles = {
                ...user.toJSON(),
                roles: roleNames
            };

            var response = new LoginResponse(userWithRoles, token)
            return res.status(200).json(new Models.ResponseModel(true, null, response));

        } else {
            return res.json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Tên người dùng hoặc mật khẩu không chính xác", null), null));

        }

    } catch (err) {
        return res.json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", err.message), null));

    }

});

//Step 1: you must validate data from request 
//If information missing , you need to response with error
//Step 2: Check user exist
router.post('/register', async (req, res, next) => {
    const { error } = await registerRequest.validate(req.body);
    if (error) {
        const formattedErrors = formatValidationError(error.details);
        return res.status(400).json({
            code: 400,
            message: "Validation Error",
            details: formattedErrors
        });
    }
    try {
        const { email, password, full_name } = req.body;

        var find_user = await User.findOne({ where: { email } });
        if (find_user) {
            return res.status(400).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Người dùng đã tồn tại", null), null));
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            email: email,
            password: hashedPassword,
            full_name: full_name,
        });

        let userRole = await permission_role.Role.findOne({ where: { name: 'user' } });
        if (!userRole) {
            userRole = await permission_role.Role.create({ name: 'user', display_name: 'Customer' });
        }
        await newUser.addRole(userRole);

        return res.status(201).json(new Models.ResponseModel(true, null, newUser));

    } catch (err) {
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", err.message), null));
    }

});


router.post('/login_google', async (req, res, next) => {
    logger.info("Login with google");
    const { error } = await login_google_request.validate(req.body);
    if (error) {
        const formattedErrors = formatValidationError(error.details);
        return res.status(400).json({
            code: 400,
            message: "Validation Error",
            details: formattedErrors
        });
    }
    try {
        const { email, password, full_name, first_name, last_name, number_phone, avatar, fcm_token, device_id } = req.body;

        const hashedPassword = await hashPassword(password);

        const [newUser, created] = await User.upsert({
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: hashedPassword,
            full_name: full_name,
            number_phone: number_phone,
            avatar: avatar
        });
        let userRole = await permission_role.Role.findOne({ where: { name: 'user' } });
        if (!userRole) {
            userRole = await permission_role.Role.create({ name: 'user', display_name: 'Customer' });
        }
        await newUser.addRole(userRole);
        LogLogin.create({
            device_id: device_id,
            fcm_token: fcm_token,
            time_login: new Date()
        });

        return res.status(201).json(new Models.ResponseModel(true, null, newUser));

    } catch (err) {
        return res.status(500).json(new Models.ResponseModel(false, new Models.ErrorResponseModel(1, "Lỗi hệ thống", err.message), null));
    }

});

// Hàm băm mật khẩu
async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt);
    
        return hash;
    } catch (err) {
        console.error('Error hashing password:', err);
        throw err; // Rethrow the error to handle it outside
    }
}

export default router;



