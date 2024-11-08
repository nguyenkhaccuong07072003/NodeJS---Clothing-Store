import { DataTypes } from 'sequelize';
import sequelize from '../connection/mysql.js';
import { v4 as uuidv4 } from 'uuid';

const Permission = sequelize.define('permission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});


//-----------------------------------------------------------------------------

const Role = sequelize.define('role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: true //Tự động thêm các trường createdAt và updatedAt
});


Permission.belongsToMany(Role, { through: 'role_has_permission', foreignKey: 'permission_id' });
Role.belongsToMany(Permission, { through: 'role_has_permission', foreignKey: 'role_id' });

export default { Permission, Role };