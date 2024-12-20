import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import Product from './product_model.js';

const Province = sequelize.define('province', {
    code: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name : {
        type: DataTypes.STRING,
        allowNull: true
    },
    slug :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    type :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    name_with_type :{
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});

//-----------------------------------------

const District = sequelize.define('district', {
    code: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name : {
        type: DataTypes.STRING,
        allowNull: true
    },
    slug :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    type :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    name_with_type :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    path:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    path_with_type:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    parent_code:{
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});

//------------------------------------------------------------------------------

const Ward = sequelize.define('ward', {
    code: {
        type: DataTypes.STRING,
        primaryKey: true,
    },

    name : {
        type: DataTypes.STRING,
        allowNull: true
    },
    slug :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    type :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    name_with_type :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    path:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    path_with_type:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    parent_code:{
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});


const DeliveryInformation = sequelize.define('delivery_information', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
    },

    province_id : {
        type: DataTypes.STRING,
        allowNull: true
    },
    district_id :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    ward_id :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    full_name:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    number_phone :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    details :{
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_id:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_default:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:()=>true
    }
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});



Province.hasMany(District,{foreignKey:'parent_code'});
District.belongsTo(Province,{foreignKey:'parent_code'});

District.hasMany(Ward,{foreignKey:'parent_code'});
Ward.belongsTo(District,{foreignKey:'parent_code'});





export default {Province,District,Ward,DeliveryInformation};