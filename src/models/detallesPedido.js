// src/models/detallesPedido.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DetallesPedido = sequelize.define(
  'detalles_pedido',
  {
    ID_Detalle: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ID_Pedido: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ID_Producto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Precio_Unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    Descuento: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    Impuesto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    Subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    Estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'Pendiente',
      validate: {
        isIn: [['Pendiente', 'Preparado', 'Entregado', 'Devuelto']]
      }
    }
  },
  {
    tableName: 'detalles_pedido',
    timestamps: false
  }
);

module.exports = DetallesPedido;
