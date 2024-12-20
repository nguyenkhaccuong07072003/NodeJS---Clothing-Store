import express from "express";
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import permission_role from '../models/permission_model.js'
import authController from '../controllers/auth.js'
const router = express.Router(); // Sử dụng express.Router()

//log_login : id, user_id, device_id, fcm_token, time_login
// use post to hash data in request
// Step 1: hash password and compare to password in database
// Step 2: IF password incorrect return message,else transfer step 3
// Step 3: Check user is_active => callback if is not active
// Step 4: Get token (jsonwebtoken) 
// Step 5: we need to add infor login on database
// Step 6: return reponse with info user and token

router.post('/login', authController.login);

//Login with admin
router.post('/admin/login', authController.loginAdmin);

//Step 1: you must validate data from request 
//If information missing , you need to response with error
//Step 2: Check user exist
router.post('/register', authController.register);


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


router.get("/find_user", authenticateToken, authorizeRole(["admin"]), authController.findUser);


export default router;




