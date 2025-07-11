// src/models/index.js

// Importa la instancia de Sequelize desde config/database.js
const { sequelize } = require('../config/database');

// Importa los archivos modelo
const Productos             = require('./productos');
const Inventario            = require('./inventario');
const MovimientosInventario = require('./movimientosInventario');
const Categorias            = require('./categorias');
const Marcas                = require('./marcas');
const Proveedores           = require('./proveedores');
const Usuario               = require('./usuarios');
const Pedidos               = require('./pedidos');
const DetallesPedido        = require('./detallesPedido');
const Sucursales            = require('./sucursales'); // ← nuevo modelo agregado

// ======================
// === Relaciones actuales (sincronizadas con tu base de datos)
// ======================

// 1) Auto-relación para Categorías (categoría padre → subcategorías)
Categorias.belongsTo(Categorias, {
  foreignKey: 'ID_Categoria_Padre',
  as: 'categoriaPadre'
});
Categorias.hasMany(Categorias, {
  foreignKey: 'ID_Categoria_Padre',
  as: 'subcategorias'
});

// 2) Categorías ↔ Productos
Categorias.hasMany(Productos, {
  foreignKey: 'ID_Categoria',
  as: 'productos'
});
Productos.belongsTo(Categorias, {
  foreignKey: 'ID_Categoria',
  as: 'categoria'
});

// 3) Marcas ↔ Productos
Marcas.hasMany(Productos, {
  foreignKey: 'ID_Marca',
  as: 'productos'
});
Productos.belongsTo(Marcas, {
  foreignKey: 'ID_Marca',
  as: 'marca'
});

// 4) Proveedores ↔ Productos
Proveedores.hasMany(Productos, {
  foreignKey: 'ID_Proveedor',
  as: 'productos'
});
Productos.belongsTo(Proveedores, {
  foreignKey: 'ID_Proveedor',
  as: 'proveedor'
});

// 5) Productos ↔ Inventario
Productos.hasMany(Inventario, {
  foreignKey: 'ID_Producto',
  as: 'inventarios'
});
Inventario.belongsTo(Productos, {
  foreignKey: 'ID_Producto',
  as: 'producto'
});

// 6) Inventario ↔ MovimientosInventario
Inventario.hasMany(MovimientosInventario, {
  foreignKey: 'ID_Inventario',
  as: 'movimientos'
});
MovimientosInventario.belongsTo(Inventario, {
  foreignKey: 'ID_Inventario',
  as: 'inventario'
});

// 7) Pedidos ↔ DetallesPedido
Pedidos.hasMany(DetallesPedido, {
  foreignKey: 'ID_Pedido',
  as: 'detalles'
});
DetallesPedido.belongsTo(Pedidos, {
  foreignKey: 'ID_Pedido',
  as: 'pedido'
});

// 8) DetallesPedido ↔ Productos
DetallesPedido.belongsTo(Productos, {
  foreignKey: 'ID_Producto',
  as: 'producto'
});
Productos.hasMany(DetallesPedido, {
  foreignKey: 'ID_Producto',
  as: 'detallesPedido'
});

// 9) Usuario (como Cliente) ↔ Pedidos
Usuario.hasMany(Pedidos, {
  foreignKey: 'ID_Cliente',
  as: 'pedidosComoCliente'
});
Pedidos.belongsTo(Usuario, {
  foreignKey: 'ID_Cliente',
  as: 'cliente'
});

// 10) Usuario (como Vendedor) ↔ Pedidos
Usuario.hasMany(Pedidos, {
  foreignKey: 'ID_Vendedor',
  as: 'pedidosComoVendedor'
});
Pedidos.belongsTo(Usuario, {
  foreignKey: 'ID_Vendedor',
  as: 'vendedor'
});

// 11) Sucursales ↔ Inventario (NUEVA RELACIÓN)
Sucursales.hasMany(Inventario, {
  foreignKey: 'ID_Sucursal',
  as: 'inventarios'
});
Inventario.belongsTo(Sucursales, {
  foreignKey: 'ID_Sucursal',
  as: 'sucursal'
});

// ======================
// Exportar todos los modelos y sequelize
// ======================
module.exports = {
  sequelize,

  // Modelos existentes
  Productos,
  Inventario,
  MovimientosInventario,
  Categorias,
  Marcas,
  Proveedores,
  Usuario,
  Pedidos,
  DetallesPedido,

  // Nuevo modelo
  Sucursales
};
