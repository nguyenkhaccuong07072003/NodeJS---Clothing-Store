import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import Category from './category_model.js';

// Hàm tính toán checksum cho EAN-13
function calculateEAN13Checksum(data) {
    if (data.length !== 12) {
        throw new Error("EAN-13 must be 12 digits long.");
    }

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const digit = parseInt(data[i], 10);
        if (i % 2 === 0) { // Vị trí chẵn (index 0, 2, 4, ...) nhân với 1
            sum += digit;
        } else { // Vị trí lẻ (index 1, 3, 5, ...) nhân với 3
            sum += digit * 3;
        }
    }

    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
}


function generateRandomId() {
    const random = Math.floor(100000000000 + Math.random() * 900000000000).toString(); // Tạo 12 chữ số ngẫu nhiên
    const checksum = calculateEAN13Checksum(random); // Tính checksum
    return random + checksum.toString(); // Ghép ID + checksum để tạo mã EAN-13
}

const Product = sequelize.define('product', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generateRandomId, // Sử dụng hàm để tạo id ngẫu nhiên,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    img_preview : {
        type: DataTypes.STRING,
        allowNull: false
    },
    price :{
        type: DataTypes.FLOAT,
        allowNull: false
    },
    description:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_public :{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:()=>true
    },
    rate:{
        type: DataTypes.FLOAT,
        defaultValue:()=>5.0
    }
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});


const ProductDetails = sequelize.define('product_details',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    quantity:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    color:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    size:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    price:{
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    product_id:{
        type: DataTypes.STRING,
        allowNull: false,
    },
},  {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
    
});


export default {Product, ProductDetails};