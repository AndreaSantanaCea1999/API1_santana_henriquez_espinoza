// src/models/marcas.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Marcas = sequelize.define(
  'Marcas',
  {
    ID_Marca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false  // tu script original indicaba IDs manuales
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Logo_URL: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Pais_Origen: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Sitio_Web: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    }
  },
  {
    tableName: 'marcas',
    timestamps: false
  }
);

module.exports = Marcas;
