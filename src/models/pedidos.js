const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pedidos = sequelize.define('PEDIDOS', {
  ID_Pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Codigo_Pedido: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  ID_Cliente: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Vendedor: {
    type: DataTypes.INTEGER
  },
  ID_Sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Fecha_Pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  Canal: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Online', 'Físico']]
    }
  },
  Estado: {
    type: DataTypes.STRING(30),
    validate: {
      isIn: [['Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto']]
    },
    defaultValue: 'Pendiente'
  },
  Metodo_Entrega: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Retiro_Tienda', 'Despacho_Domicilio']]
    }
  },
  Direccion_Entrega: {
    type: DataTypes.STRING(200)
  },
  Ciudad_Entrega: {
    type: DataTypes.STRING(50)
  },
  Region_Entrega: {
    type: DataTypes.STRING(50)
  },
  Pais_Entrega: {
    type: DataTypes.STRING(50),
    defaultValue: 'Chile'
  },
  Comentarios: {
    type: DataTypes.STRING(500)
  },
  Subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  Descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  Impuestos: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  Costo_Envio: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  Total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  ID_Divisa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1 // Asumiendo que 1 es CLP
  },
  Fecha_Estimada_Entrega: {
    type: DataTypes.DATE
  },
  Prioridad: {
    type: DataTypes.STRING(20),
    defaultValue: 'Normal',
    validate: {
      isIn: [['Baja', 'Normal', 'Alta', 'Urgente']]
    }
  }
}, {
  tableName: 'PEDIDOS',
  timestamps: false
});

module.exports = Pedidos;