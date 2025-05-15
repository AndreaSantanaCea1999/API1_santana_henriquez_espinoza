const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  ID_Pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  Codigo_Pedido: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  ID_Cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ID_Vendedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ID_Sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Fecha_Pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  Canal: {
    type: DataTypes.ENUM('Online', 'Físico'),
    allowNull: true,
  },
  Estado: {
    type: DataTypes.ENUM('Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto'),
    defaultValue: 'Pendiente',
    allowNull: false,
  },
  Metodo_Entrega: {
    type: DataTypes.ENUM('Retiro_Tienda', 'Despacho_Domicilio'),
    allowNull: true,
  },
  Pais_Entrega: {
    type: DataTypes.STRING(50),
    defaultValue: 'Chile',
  },
  Subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  Descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  Impuestos: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  Costo_Envio: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  Total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  ID_Divisa: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Prioridad: {
    type: DataTypes.ENUM('Baja', 'Normal', 'Alta', 'Urgente'),
    defaultValue: 'Normal',
  }
}, {
  tableName: 'PEDIDOS',
  timestamps: false,
});

module.exports = Pedido;
