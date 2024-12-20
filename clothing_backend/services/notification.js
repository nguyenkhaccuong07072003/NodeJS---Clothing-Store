// notification_service.js
import admin from './firebase_admin.js';
import { default as User } from '../models/user_model.js';
import LogLogin from '../models/log_login.js';

// Hàm gửi thông báo
export const sendNotification = async (userId, notification) => {
  try {
    // Tìm người dùng trong cơ sở dữ liệu
    const logLogin = await LogLogin.findOne({
      where: { user_id: userId },
      order: [['time_login', 'DESC']], // Sắp xếp theo time_login giảm dần
  });

    if (!logLogin) {
      throw new Error(`Người dùng với ID ${userId} không tồn tại.`);
    }

    if (!logLogin.fcm_token) {
      throw new Error(`Người dùng với ID ${userId} không có deviceToken.`);
    }

    // Chuẩn bị thông báo
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      token: logLogin.fcm_token,
    };
    // Gửi thông báo Firebase
    const response = await admin.messaging().send(message);
    console.log(`Thông báo gửi thành công tới người dùng ${userId}:`, response);
    return response;

  } catch (error) {
    console.error(`Lỗi khi gửi thông báo tới người dùng ${userId}:`, error.message);
    if (error.errorInfo) {
      console.error('Chi tiết lỗi Firebase:', error.errorInfo);
    }
    throw error;
  }
};
