// src/models/proveedores.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proveedores = sequelize.define(
  'proveedores',
  {
    ID_Proveedor: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false   // tu script original definía IDs manuales
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    RUT: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    Contacto_Nombre: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Contacto_Email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    Contacto_Telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Direccion: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    Pais: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Tiempo_Entrega_Promedio: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Condiciones_Pago: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    Sitio_Web: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    }
    // NOTA: NO definimos 'estado', 'createdAt' ni 'updatedAt' porque tu tabla no los incluye.
  },
  {
    tableName: 'proveedores',
    timestamps: false
  }
);

module.exports = Proveedores;
