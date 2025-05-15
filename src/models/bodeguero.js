const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bodeguero = sequelize.define('Bodeguero', {
  ID_Bodeguero: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nombre: { type: DataTypes.STRING(100), allowNull: false },
  Telefono: { type: DataTypes.STRING(20) }
}, {
  tableName: 'BODEGUEROS',
  timestamps: false
});

module.exports = Bodeguero;
