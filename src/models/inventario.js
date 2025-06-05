// src/models/inventario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventario = sequelize.define(
  'Inventario',
  {
    ID_Inventario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ID_Producto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ID_Sucursal: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Stock_Actual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    Stock_Minimo: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    Stock_Maximo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Stock_Reservado: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    Punto_Reorden: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Ubicacion_Almacen: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Ultima_Actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ID_Bodeguero: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: 'inventario',
    timestamps: false
  }
);

module.exports = Inventario;
