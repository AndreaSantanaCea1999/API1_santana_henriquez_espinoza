// src/models/productos.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Productos = sequelize.define(
  'Productos',
  {
    ID_Producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    Nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    Especificaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ID_Categoria: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ID_Marca: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ID_Proveedor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Codigo_Proveedor: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ID_Divisa: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Precio_Compra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    Precio_Venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    Descuento_Maximo: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    Tasa_Impuesto: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 19
    },
    Peso: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    Dimensiones: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Imagen_URL: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Destacado: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    Estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'Activo',
      validate: {
        isIn: [['Activo', 'Inactivo', 'Descontinuado']]
      }
    },
    Fecha_Creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    Ultima_Actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'productos',
    timestamps: false
  }
);

module.exports = Productos;
