const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('USUARIO', {
  ID_Usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
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
    unique: true
  },
  Telefono: {
    type: DataTypes.STRING(20)
  },
  Direccion: {
    type: DataTypes.STRING(200)
  },
  Ciudad: {
    type: DataTypes.STRING(50)
  },
  Region: {
    type: DataTypes.STRING(50)
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
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  Ultima_Actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'usuario',
  timestamps: false
});

module.exports = Usuario;