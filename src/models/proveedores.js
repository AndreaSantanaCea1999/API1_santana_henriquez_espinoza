const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proveedores = sequelize.define('Proveedores', {
  ID_Proveedor: {
    type: DataTypes.INTEGER,
    primaryKey: true, // Sigue siendo la clave primaria
    autoIncrement: false, // Ya no es auto-incremental
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
  sitio_web: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  Condiciones_Pago: { // Movido para agrupar con otros campos descriptivos
    type: DataTypes.STRING(200),
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['Activo', 'Inactivo']] // Ejemplo de valores permitidos
    }
  }
}, {
  tableName: 'proveedores',
  timestamps: true // Habilitar timestamps automáticos
});

module.exports = Proveedores;