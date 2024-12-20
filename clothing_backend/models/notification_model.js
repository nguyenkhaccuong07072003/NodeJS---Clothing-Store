import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import User from './user_model.js';
import { now } from 'sequelize/lib/utils';

const Notification = sequelize.define('notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title : {
        type: DataTypes.STRING,
        allowNull: false
    },
    content :{
        type: DataTypes.STRING,
        allowNull: false,
    },   
    date:{
        type:DataTypes.DATE,
        allowNull:false,
        defaultValue:()=> now()
    },
    type :{
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_action :{
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },    
    user_id :{
        type: DataTypes.STRING,
        allowNull: false,
    },   
    is_read:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:()=>false
    }

}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});


export default Notification;