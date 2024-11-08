import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import ProductDetails from './product_model.js';
import Voucher from './voucher_model.js'

const Order = sequelize.define('order', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,       //Khóa chính
        defaultValue: () => uuidv4(),   //Random
    },
    order_date :{
        type: DataTypes.DATE,
        allowNull: false,
    },

    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    real_total: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },

   
    voucher_id:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    fee_ship:{
        type:DataTypes.FLOAT,
        allowNull:true,
        defaultValue:()=>0
    },

    delivery_information :{
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_id:{
        type: DataTypes.STRING,
        allowNull: false,
    },

}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});


//---------------------------------------------------

const OrderItem = sequelize.define('order_item',{
    id: {
        type: DataTypes.STRING,
        primaryKey: true,       
        defaultValue: () => uuidv4(),   
    },
    order_id:{
        type: DataTypes.STRING,
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
    quantity:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },

})



const OrderStatus = sequelize.define('order_status',{
    id: {
        type: DataTypes.STRING,
        primaryKey: true,       
        defaultValue: () => uuidv4(),   
    },
    order_id:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    status:{
        type:DataTypes.STRING,
        allowNull:false
    },
    note:{
        type:DataTypes.STRING,
        allowNull:true
    }
    
}, {
    timestamps: true 
});



export default {Order, OrderItem,OrderStatus};