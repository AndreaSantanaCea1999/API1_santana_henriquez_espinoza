const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sucursales = sequelize.define('sucursales', {
  ID_Sucursal: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Direccion: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Ciudad: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Region: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Horario_Atencion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  Estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'Activa',
    validate: {
      isIn: [['Activa', 'Inactiva']]
    }
  },
  Latitud: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true
  },
  Longitud: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true
  }
}, {
  tableName: 'sucursales',
  timestamps: false
});

module.exports = Sucursales;