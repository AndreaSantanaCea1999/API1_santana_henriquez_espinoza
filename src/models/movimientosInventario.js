// src/models/movimientosInventario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MovimientosInventario = sequelize.define( 
  'movimientos_inventario',
  {
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
      allowNull: false,
      validate: {
        isIn: [['Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia']]
      }
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
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ID_Devolucion: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ID_Bodeguero: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Comentario: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ID_Sucursal_Destino: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: 'movimientos_inventario',
    timestamps: false
  }
);

module.exports = MovimientosInventario;
