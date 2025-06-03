const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MovimientosInventario = sequelize.define('MOVIMIENTOS_INVENTARIO', {
  ID_Movimiento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Inventario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Tipo_Movimiento: {
    type: DataTypes.STRING(30),
    validate: {
      isIn: [['Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia']]
    },
    allowNull: false
  },
  Cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ID_Pedido: {
    type: DataTypes.INTEGER
  },
  ID_Devolucion: {
    type: DataTypes.INTEGER
  },
  ID_Bodeguero: {
    type: DataTypes.INTEGER
  },
  Comentario: {
    type: DataTypes.STRING(500)
  },
  ID_Sucursal_Destino: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'movimientos_inventario',
  timestamps: false
});

module.exports = MovimientosInventario;