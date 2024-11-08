import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import Product from './product_model.js';

const Category = sequelize.define('category', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name : {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_public :{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:()=>true
    }
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});

export default Category;