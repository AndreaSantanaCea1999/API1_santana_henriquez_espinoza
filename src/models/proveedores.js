const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proveedores = sequelize.define('Proveedores', {
  ID_Proveedor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
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
    allowNull: true
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
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  sitio_web: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  persona_contacto: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  updatedAt: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'proveedores',
  timestamps: false
});

module.exports = Proveedores;