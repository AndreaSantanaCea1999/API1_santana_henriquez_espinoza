const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventario = sequelize.define('Inventario', {
  ID_Inventario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ID_Producto: { type: DataTypes.INTEGER, allowNull: false },
  ID_Sucursal: { type: DataTypes.INTEGER, allowNull: false },
  Stock_Actual: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  Stock_Minimo: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  Stock_Maximo: { type: DataTypes.INTEGER },
  Stock_Reservado: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  Punto_Reorden: { type: DataTypes.INTEGER },
  Ubicacion_Almacen: { type: DataTypes.STRING(50) },
  Ultima_Actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  ID_Bodeguero: { type: DataTypes.INTEGER }
}, {
  tableName: 'INVENTARIO',
  timestamps: false
});

module.exports = Inventario;
