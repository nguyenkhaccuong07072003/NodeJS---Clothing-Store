import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import User from './user_model.js';
import ProductDetails from './product_model.js';

const Cart = sequelize.define('cart', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id : {
        type: DataTypes.STRING,
        allowNull: false
    },

}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});



const CartItem = sequelize.define('cart_item',{
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    product_details_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    cart_id :{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity:
    {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    color:{
        type:DataTypes.STRING,
        allowNull:false
    },
    size:{
        type:DataTypes.STRING,
        allowNull:false
    }
});

// User.hasOne(Cart,{foreignKey:'user_id'});
// Cart.belongsTo(User,{foreignKey:'cart_id'});

// Cart.hasMany(CartDetails, {foreignKey:'cart_id'});
// CartDetails.belongsTo(Cart, {foreignKey:'cart_detail_id'});

// //Chưa chắc chắn lắm
// CartDetails.belongsToMany(ProductDetails, {foreignKey:'cart_detail_id'});
// ProductDetails.belongsToMany(CartDetails, {foreignKey:'product_detail_id'});


export default {Cart,CartItem};