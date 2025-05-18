const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Productos = sequelize.define('PRODUCTOS', {
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
    type: DataTypes.STRING(1000)
  },
  Especificaciones: {
    type: DataTypes.TEXT
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
    type: DataTypes.INTEGER
  },
  Codigo_Proveedor: {
    type: DataTypes.STRING(50)
  },
  ID_Divisa: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Precio_Compra: {
    type: DataTypes.DECIMAL(10, 2)
  },
  Precio_Venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  Descuento_Maximo: {
    type: DataTypes.DECIMAL(5, 2)
  },
  Tasa_Impuesto: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 19
  },
  Peso: {
    type: DataTypes.DECIMAL(8, 2)
  },
  Dimensiones: {
    type: DataTypes.STRING(50)
  },
  Imagen_URL: {
    type: DataTypes.STRING(255)
  },
  Destacado: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Estado: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Activo', 'Inactivo', 'Descontinuado']]
    },
    defaultValue: 'Activo'
  },
  Fecha_Creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  Ultima_Actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'PRODUCTOS',
  timestamps: false
});

module.exports = Productos;