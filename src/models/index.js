// src/models/index.js

// Importa la instancia de sequelize directamente desde config
const { sequelize } = require('../config/database');

// Importa los modelos individualmente
const Productos = require('./productos');
const Inventario = require('./inventario');
const MovimientosInventario = require('./movimientosInventario');
const Categorias = require('./categorias');
const Marcas = require('./marcas');
const Proveedores = require('./proveedores');

// Define relaciones entre modelos
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

// Exportar todos los modelos y sequelize
module.exports = {
  sequelize,
  Productos,
  Inventario,
  MovimientosInventario,
  Categorias,
  Marcas,
  Proveedores
};