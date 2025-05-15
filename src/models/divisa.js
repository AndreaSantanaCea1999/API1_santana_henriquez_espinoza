const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Divisa = sequelize.define('Divisa', {
  ID_Divisa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Codigo: { type: DataTypes.STRING(10), unique: true, allowNull: false },
  Nombre: { type: DataTypes.STRING(50), allowNull: false },
  Simbolo: { type: DataTypes.STRING(5), allowNull: false },
  Es_Default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'DIVISAS',
  timestamps: false
});

module.exports = Divisa;
