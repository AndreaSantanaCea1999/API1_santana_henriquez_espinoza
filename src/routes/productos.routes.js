// c:\Users\andre\Desktop\API1_santana_henriquez_espinoza\src\routes\productos.routes.js
const express = require('express');
const router = express.Router();
// const { pool } = require('../config/db'); // No es necesario aquí si toda la lógica de BD está en el controlador

// Asegúrate de que la ruta a tu controlador de productos sea correcta
const ProductosController = require('../controllers/productos.controller');

// --- Rutas para Productos ---

// GET /api/productos - Obtener todos los productos
router.get('/', ProductosController.listarProductos);

// GET /api/productos/:id_o_codigo - Obtener un producto por su ID o Código
router.get('/:id_o_codigo', ProductosController.obtenerProductoPorIdOCodigo);

// POST /api/productos - Crear un nuevo producto
router.post('/', ProductosController.crearProducto);

// PATCH /api/productos/:id - Actualizar un producto existente (se usa el ID numérico del producto)
router.patch('/:id', ProductosController.actualizarProducto);

// DELETE /api/productos/:id - Eliminar un producto (se usa el ID numérico del producto)
router.delete('/:id', ProductosController.eliminarProducto);

module.exports = router;