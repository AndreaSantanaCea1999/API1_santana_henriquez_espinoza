const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Producto = sequelize.define('Producto', {
  ID_Producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Codigo: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  Nombre: { type: DataTypes.STRING(150), allowNull: false },
  Descripcion: { type: DataTypes.STRING(500) },
  Estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo', 'Descontinuado'),
    defaultValue: 'Activo'
  }
}, {
  tableName: 'PRODUCTOS',
  timestamps: false
});

module.exports = Producto;
