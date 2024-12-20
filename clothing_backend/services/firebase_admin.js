import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Đường dẫn tệp service-account.json
const serviceAccountPath = path.resolve('service-account.json');

// Đọc tệp JSON và chuyển thành đối tượng
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Khởi tạo Firebase Admin SDK
let firebaseAdminApp;
if (!admin.apps.length) {
  firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  firebaseAdminApp = admin.app();
}

export default firebaseAdminApp;
