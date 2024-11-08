import express from 'express';
const app = express()   //Init app from express
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import sequelize from './connection/mysql.js';
import user from './models/user_model.js';
import permission from './models/permission_model.js';
import Category from './models/category_model.js';
import address_model from './models/address_model.js';
import User from './models/user_model.js';
import cart_model from './models/cart_model.js';
import order_model from './models/order_model.js';
import Voucher from './models/voucher_model.js';
import product_model from './models/product_model.js';
import Notification from './models/notification_model.js';
import Image from './models/image_model.js';
import swaggerDocs from './utils/swagger.js';
import logger from './utils/logger.js';
import authentication from './routers/authentication_router.js'
import productRouter from './routers/product_router.js'
import orderRouter from './routers/order_router.js'
import bodyParser from 'body-parser';
import LogLogin from './models/log_login.js';
import permission_model from './models/permission_model.js';
import upload from './config/upload.js';
import image_router from './routers/images_route.js'
import cart_router from './routers/cart_route.js'
import address_route from './routers/address_route.js'
import voucher_router from './routers/voucher_router.js'
import notification_Router from './routers/notification_router.js'
//Application config
dotenv.config();
const port = process.env.PORT || 8080
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//CORS: Chính sách truyền tải qua domain
//Origin = domain + port
// Need to config CORS, because policy google chorme has been blocked
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type, Accept,Authorization,Origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

// Sử dụng body-parser middleware để phân tích các yêu cầu POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



async function syncDatabase() {
    try {
        // Mở kết nối
        await sequelize.authenticate();
        logger.info('Connection has been established successfully.');

        const is_reset_database = false;

        // Định nghĩa quan hệ giữa User và Order
        User.hasMany(order_model.Order, { foreignKey: 'user_id' });   // Một User có thể có nhiều Order
        order_model.Order.belongsTo(User, { foreignKey: 'user_id' }); // Một Order chỉ thuộc về một User

        User.hasMany(LogLogin, { foreignKey: 'user_id' });   // Một User có thể có nhiều Order
        LogLogin.belongsTo(User, { foreignKey: 'user_id' }); // Một Order chỉ thuộc về một User


        product_model.Product.belongsToMany(Category, { through: 'category_product', foreignKey: 'product_id' });
        Category.belongsToMany(product_model.Product, { through: 'category_product', foreignKey: 'category_id' });

        product_model.ProductDetails.belongsTo(product_model.Product, { foreignKey: 'product_id' });
        product_model.Product.hasMany(product_model.ProductDetails, { foreignKey: 'product_id' });

        //Address
        User.hasMany(address_model.DeliveryInformation,{foreignKey:'user_id'});
        address_model.DeliveryInformation.belongsTo(User, { foreignKey: 'user_id' });

        address_model.Province.hasMany(address_model.DeliveryInformation,{foreignKey:'province_id'});
        address_model.DeliveryInformation.belongsTo(address_model.Province,{foreignKey:'province_id'});   
        
        address_model.District.hasMany(address_model.DeliveryInformation,{foreignKey:'district_id'});
        address_model.DeliveryInformation.belongsTo(address_model.District,{foreignKey:'district_id'});   

        address_model.Ward.hasMany(address_model.DeliveryInformation,{foreignKey:'ward_id'});
        address_model.DeliveryInformation.belongsTo(address_model.Ward,{foreignKey:'ward_id'}); 


        //Cart
        User.hasOne(cart_model.Cart, { foreignKey: 'user_id' });
        cart_model.Cart.belongsTo(User, { foreignKey: 'user_id' });


        cart_model.Cart.hasMany(cart_model.CartItem, { foreignKey: 'cart_id' });
        cart_model.CartItem.belongsTo(cart_model.Cart, { foreignKey: 'cart_id' });

        cart_model.CartItem.belongsTo(product_model.ProductDetails, { foreignKey: 'product_details_id' });
        product_model.ProductDetails.hasMany(cart_model.CartItem, { foreignKey: 'product_details_id' });

        //Notification
        User.hasMany(Notification, { foreignKey: 'user_id' });
        Notification.belongsTo(User, { foreignKey: 'user_id' });

        //Order : n - n Product

        order_model.Order.belongsToMany(product_model.Product, {
            through: order_model.OrderItem,
            foreignKey: 'order_id',    // Khóa ngoại trong OrderItem trỏ tới Order
            otherKey: 'product_id'     // Khóa ngoại trong OrderItem trỏ tới Product
        });

        product_model.Product.belongsToMany(order_model.Order, {
            through: order_model.OrderItem,
            foreignKey: 'product_id',  // Khóa ngoại trong OrderItem trỏ tới Product
            otherKey: 'order_id'       // Khóa ngoại trong OrderItem trỏ tới Order
        });

        order_model.Order.hasMany(order_model.OrderStatus,{foreignKey:"order_id"});
        order_model.OrderStatus.belongsTo(order_model.Order,{foreignKey:"order_id"});

        Voucher.hasMany(order_model.Order, { foreignKey: 'voucher_id' });
        order_model.Order.belongsTo(Voucher, { foreignKey: 'voucher_id' });
        //Product - ProductDetail
        product_model.Product.hasMany(product_model.ProductDetails, { foreignKey: 'product_id' });


        //Voucher
        User.belongsToMany(Voucher, { through: 'voucher_user', foreignKey: 'user_id' });
        Voucher.belongsToMany(User, { through: 'voucher_user', foreignKey: 'voucher_id' });


        await sequelize.sync({ force: is_reset_database }); // Sử dụng { force: true } để xóa và tạo lại bảng

        if(!is_reset_database){
            logger.info('Not allow reset database!');
            return;  
        }

        const rawProvince = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/tinh_tp.json'), 'utf-8'));
        const rawDistrict = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/quan_huyen.json'), 'utf-8'));
        const rawWard = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/xa_phuong.json'), 'utf-8'));
        const rawProduct = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/products.json'), 'utf-8'));
        const rawImage = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/image_table.json'), 'utf-8'));
        const raw_product_details = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/product_details.json'), 'utf-8'));
        const raw_category = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/categories_table.json'), 'utf-8'));
        const rawPermission = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/permission_data.json'), 'utf-8'));
        const raw_prod_cate = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/category_prod.json'), 'utf-8'));
        const raw_images = await JSON.parse(fs.readFileSync(path.join(__dirname, '/static/image_table.json'), 'utf-8'));
        const dataProvince = Object.values(rawProvince);
        const dataDistrict = Object.values(rawDistrict);
        const dataWard = Object.values(rawWard);


        await address_model.Province.bulkCreate(dataProvince, { ignoreDuplicates: true })
        await address_model.District.bulkCreate(dataDistrict, { ignoreDuplicates: true })
        await address_model.Ward.bulkCreate(dataWard, { ignoreDuplicates: true })

        await product_model.Product.bulkCreate(rawProduct, { ignoreDuplicates: true })
        await Image.bulkCreate(rawImage, { ignoreDuplicates: true })
        await product_model.ProductDetails.bulkCreate(raw_product_details, { ignoreDuplicates: true })
        await Category.bulkCreate(raw_category, { ignoreDuplicates: true })
        await Image.bulkCreate(raw_images, { ignoreDuplicates: true });

        await permission_model.Permission.bulkCreate(rawPermission.permissions);
        await permission_model.Role.bulkCreate(rawPermission.roles);
        const roles = await permission_model.Role.findAll();
        const permissions = await permission_model.Permission.findAll();
        const roleHasPermissionData = rawPermission.roleHasPermission.map((entry) => {
            const role = roles.find(r => r.name === entry.role_name);
            const permission = permissions.find(p => p.name === entry.permission_name);

            return {
                role_id: role.id,
                permission_id: permission.id
            };
        });

        // Sử dụng bulkCreate để thêm dữ liệu vào bảng trung gian
        await sequelize.model('role_has_permission').bulkCreate(roleHasPermissionData);
        await sequelize.model('category_product').bulkCreate(raw_prod_cate);

        // Đồng bộ hóa cơ sở dữ liệu
        logger.info('All tables created successfully!');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

syncDatabase();


//----------------------------  ROUTER --------------------------------------------------------------

app.get('/', (req, res) => {
    res.send("This is sample backend, it's api for clothing store")
})



app.use('/api/auth', authentication);

app.use('/api',productRouter)
app.use('/api',image_router)
app.use('/api/orders',orderRouter);
app.use('/api',cart_router);
app.use('/api/address',address_route);
app.use('/api/',voucher_router);
app.use('/api', notification_Router);

app.post('/upload-multiple', upload.array('images', 10), (req, res) => {
    try {
        res.status(200).json({
            message: 'Files uploaded successfully',
            files: req.files
        });
    } catch (error) {
        res.status(500).json({
            message: 'File upload failed',
            error: error.message
        });
    }
});


//--------------------------------------- MAIN ------------------------------------------------


app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`)
    swaggerDocs(app, port);
})




