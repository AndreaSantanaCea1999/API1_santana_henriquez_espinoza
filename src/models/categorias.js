// src/models/categorias.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Categorias = sequelize.define(
  'categorias',
  {
    ID_Categoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ID_Categoria_Padre: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Nivel: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Icono_URL: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Orden_Visualizacion: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: 'categorias',
    timestamps: false
  }
);

module.exports = Categorias;
