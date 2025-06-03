// src/models/index.js

// Importa la instancia de sequelize directamente desde config
const { sequelize } = require('../config/database');

// Importa los modelos existentes
const Productos = require('./productos');
const Inventario = require('./inventario');
const MovimientosInventario = require('./movimientosInventario');
const Categorias = require('./categorias');
const Marcas = require('./marcas');
const Proveedores = require('./proveedores');

// Importa los nuevos modelos
const Usuario = require('./usuarios');
const Pedidos = require('./pedidos');
const DetallesPedido = require('./detallesPedido');

// === RELACIONES EXISTENTES ===

// Auto-relación para categorías padre-hijo
Categorias.belongsTo(Categorias, { foreignKey: 'ID_Categoria_Padre', as: 'categoriaPadre' });
Categorias.hasMany(Categorias, { foreignKey: 'ID_Categoria_Padre', as: 'subcategorias' });

// Relaciones de categorías-productos
Categorias.hasMany(Productos, { foreignKey: 'ID_Categoria', as: 'productos' });
Productos.belongsTo(Categorias, { foreignKey: 'ID_Categoria', as: 'categoria' });

// Relaciones de marcas-productos
Marcas.hasMany(Productos, { foreignKey: 'ID_Marca', as: 'productos' });
Productos.belongsTo(Marcas, { foreignKey: 'ID_Marca', as: 'marca' });

// Relaciones de proveedores-productos
Proveedores.hasMany(Productos, { foreignKey: 'ID_Proveedor', as: 'productos' });
Productos.belongsTo(Proveedores, { foreignKey: 'ID_Proveedor', as: 'proveedor' });

// Relaciones de productos-inventario
Productos.hasMany(Inventario, { foreignKey: 'ID_Producto', as: 'inventarios' });
Inventario.belongsTo(Productos, { foreignKey: 'ID_Producto', as: 'producto' });

// Relaciones de inventario-movimientos
Inventario.hasMany(MovimientosInventario, { foreignKey: 'ID_Inventario', as: 'movimientos' });
MovimientosInventario.belongsTo(Inventario, { foreignKey: 'ID_Inventario', as: 'inventario' });

// === NUEVAS RELACIONES PARA PEDIDOS ===

// Relación Pedidos -> DetallesPedido (Un pedido tiene muchos detalles)
Pedidos.hasMany(DetallesPedido, { foreignKey: 'ID_Pedido', as: 'detalles' });
DetallesPedido.belongsTo(Pedidos, { foreignKey: 'ID_Pedido', as: 'pedido' });

// Relación DetallesPedido -> Productos (Un detalle pertenece a un producto)
DetallesPedido.belongsTo(Productos, { foreignKey: 'ID_Producto', as: 'producto' });
Productos.hasMany(DetallesPedido, { foreignKey: 'ID_Producto', as: 'detallesPedido' });

// Relación Usuario -> Pedidos (Un usuario/cliente puede tener muchos pedidos)
Usuario.hasMany(Pedidos, { foreignKey: 'ID_Cliente', as: 'pedidosComoCliente' });
Pedidos.belongsTo(Usuario, { foreignKey: 'ID_Cliente', as: 'cliente' });

// Relación Usuario -> Pedidos como Vendedor (Un vendedor puede atender muchos pedidos)
Usuario.hasMany(Pedidos, { foreignKey: 'ID_Vendedor', as: 'pedidosComoVendedor' });
Pedidos.belongsTo(Usuario, { foreignKey: 'ID_Vendedor', as: 'vendedor' });

// Exportar todos los modelos y sequelize
module.exports = {
  sequelize,
  // Modelos existentes
  Productos,
  Inventario,
  MovimientosInventario,
  Categorias,
  Marcas,
  Proveedores,
  // Nuevos modelos
  Usuario,
  Pedidos,
  DetallesPedido
};