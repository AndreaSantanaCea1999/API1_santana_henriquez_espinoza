const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  ID_Cliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nombre: { type: DataTypes.STRING(100), allowNull: false },
  RUT: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  Email: { type: DataTypes.STRING(100) },
  Telefono: { type: DataTypes.STRING(20) },
  Direccion: { type: DataTypes.STRING(200) },
  Ciudad: { type: DataTypes.STRING(50) },
  Region: { type: DataTypes.STRING(50) },
  Tipo_Cliente: {
    type: DataTypes.ENUM('Regular', 'Preferente', 'Corporativo'),
    defaultValue: 'Regular'
  }
}, {
  tableName: 'CLIENTES',
  timestamps: false
});

module.exports = Cliente;
