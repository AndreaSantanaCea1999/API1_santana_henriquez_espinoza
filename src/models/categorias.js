const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Categorias = sequelize.define('CATEGORIAS', {
  ID_Categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Descripcion: {
    type: DataTypes.STRING(500)
  },
  ID_Categoria_Padre: {
    type: DataTypes.INTEGER
  },
  Nivel: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Icono_URL: {
    type: DataTypes.STRING(255)
  },
  Orden_Visualizacion: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'CATEGORIAS',
  timestamps: false
});

module.exports = Categorias;