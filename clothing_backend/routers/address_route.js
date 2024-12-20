import express from "express";
const router = express.Router(); // Sử dụng express.Router()
import { authenticateToken, authorizeRole } from "../config/jwt_filter.js";
import addressControl from '../controllers/address_controller.js'



router.get("/provinces", addressControl.getProvinces);

router.get('/p',addressControl.getDistrictByProviceId);

router.get('/d', addressControl.getWardsByDistrictID);

router.post("/delivery", authenticateToken, authorizeRole(["user"]), addressControl.addDelivery);

router.put("/delivery", authenticateToken, authorizeRole(["user"]), addressControl.updateDelivery);

router.get("/delivery", authenticateToken, authorizeRole(["user"]), addressControl.getDelivery);

router.delete('/delivery',authenticateToken, authorizeRole(["user"]), addressControl.deleteDelivery)

export default router;