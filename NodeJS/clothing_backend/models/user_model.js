import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';
import permission_model from './permission_model.js';
// Định nghĩa model User
const User = sequelize.define('user', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    full_name : {
        type: DataTypes.STRING,
        allowNull: true
    },
    date_of_birth : {
        type: DataTypes.DATE,
        allowNull: true
    },
    number_phone : {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true ,
        allowNull: false
    },
    gender : {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false
    },
    is_active :{
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {

    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});

User.belongsToMany(permission_model.Role, { through: 'user_has_role', foreignKey: 'user_id' });
permission_model.Role.belongsToMany(User, { through: 'user_has_role', foreignKey: 'role_id' });
export default User;