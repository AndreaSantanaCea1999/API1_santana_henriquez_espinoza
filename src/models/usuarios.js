// src/models/usuarios.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define(
  'Usuario',
  {
    ID_Usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    RUT: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    Telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Direccion: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    Ciudad: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Region: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'Activo',
      validate: {
        isIn: [['Activo', 'Inactivo', 'Suspendido']]
      }
    },
    Fecha_Registro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    Ultima_Actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'usuario',
    timestamps: false
  }
);

module.exports = Usuario;
