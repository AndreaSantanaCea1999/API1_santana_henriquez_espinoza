const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Marcas = sequelize.define('MARCAS', {
  ID_Marca: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: false // Ya no es auto-incremental
  },
  Nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Descripcion: {
    type: DataTypes.STRING(500)
  },
  Logo_URL: {
    type: DataTypes.STRING(255)
  },
  Pais_Origen: {
    type: DataTypes.STRING(50)
  },
  Sitio_Web: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'MARCAS',
  timestamps: false
});

module.exports = Marcas;