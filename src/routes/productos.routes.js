const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');


// Asegúrate de que la ruta a tu controlador de productos sea correcta
// Si tu controlador está en src/api/controllers/productos.controller.js
const ProductosController = require('../controllers/productos.controller');

// --- Rutas para Productos ---

// GET /api/productos - Obtener todos los productos
// Asumiendo que el prefijo /api se define en el archivo principal de la app de inventario
router.get('/', ProductosController.listarProductos);

// GET /api/productos/:id - Obtener un producto por su ID
router.get('/:id', ProductosController.obtenerProductoPorId);

// Aquí podrías añadir más rutas si tu API de Inventario las necesita, por ejemplo:
// POST /api/productos - Crear un nuevo producto
// router.post('/', ProductosController.crearProducto);

// PATCH /api/productos/:id - Actualizar un producto
// router.patch('/:id', ProductosController.actualizarProducto);

// DELETE /api/productos/:id - Eliminar un producto
// router.delete('/:id', ProductosController.eliminarProducto);

module.exports = router;