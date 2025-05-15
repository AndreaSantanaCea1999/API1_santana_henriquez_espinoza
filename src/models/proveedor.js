const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  ID_Proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Nombre: { type: DataTypes.STRING(100), allowNull: false },
  RUT: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  Contacto_Nombre: { type: DataTypes.STRING(100) },
  Contacto_Email: { type: DataTypes.STRING(100) },
  Contacto_Telefono: { type: DataTypes.STRING(20) },
  Direccion: { type: DataTypes.STRING(200) },
  Pais: { type: DataTypes.STRING(50) },
  Tiempo_Entrega_Promedio: { type: DataTypes.INTEGER },
  Condiciones_Pago: { type: DataTypes.STRING(200) }
}, {
  tableName: 'PROVEEDORES',
  timestamps: false
});

module.exports = Proveedor;
