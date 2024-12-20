import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';



const LogLogin = sequelize.define('log_login', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    device_id : {
        type: DataTypes.STRING,
        allowNull: true
    },
    fcm_token :{
        type: DataTypes.STRING,
        allowNull: true,
    },   
    time_login :{
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: false //Tự động thêm các trường createdAt và updatedAt
});

export default LogLogin;