import Queue from 'bull';
import { sendNotification } from '../services/notification.js';

// Tạo hàng đợi tên "notifications"
const notificationQueue = new Queue('notifications');

// Xử lý tác vụ trong hàng đợi
notificationQueue.process(async (job) => {
  const { deviceToken, notification } = job.data;

  console.log(`Đang xử lý thông báo cho token: ${deviceToken}`);
  await sendNotification(deviceToken, notification);
});

export default notificationQueue;
