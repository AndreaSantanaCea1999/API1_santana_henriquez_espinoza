const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sucursal = sequelize.define('Sucursal', {
  ID_Sucursal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nombre: { type: DataTypes.STRING(100), allowNull: false },
  Direccion: { type: DataTypes.STRING(200), allowNull: false },
  Ciudad: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'SUCURSALES',
  timestamps: false
});

module.exports = Sucursal;
