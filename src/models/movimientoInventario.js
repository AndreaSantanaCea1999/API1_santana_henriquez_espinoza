const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoInventario = sequelize.define('MovimientoInventario', {
  ID_Movimiento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ID_Inventario: { type: DataTypes.INTEGER, allowNull: false },
  Tipo_Movimiento: {
    type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia'),
    allowNull: false
  },
  Cantidad: { type: DataTypes.INTEGER, allowNull: false },
  Fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  Comentario: { type: DataTypes.STRING(500) }
}, {
  tableName: 'MOVIMIENTOS_INVENTARIO',
  timestamps: false
});

module.exports = MovimientoInventario;
