import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';


const Image = sequelize.define('image', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    model_name : {
        type: DataTypes.STRING,
        allowNull: false
    },
    model_id :{
        type: DataTypes.STRING,
        allowNull: false,
    },   
    path :{
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});

export default Image;