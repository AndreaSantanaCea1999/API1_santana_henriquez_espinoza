// src/routes/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

// Ruta para obtener todos los pedidos con filtros y paginación
router.get('/', pedidosController.getAllPedidos);

// Ruta para obtener estadísticas de pedidos (totales, estados, etc)
router.get('/estadisticas', pedidosController.getEstadisticasPedidos);

// Obtener un pedido específico por ID
router.get('/:id', pedidosController.getPedidoById);

// Crear un nuevo pedido
router.post('/', pedidosController.createPedido);

// Actualizar el estado de un pedido (ejemplo: "por despachar", "enviado", etc)
router.put('/:id/estado', pedidosController.updateEstadoPedido);

// Cancelar un pedido (puede liberar stock y actualizar estado)
// Aquí puedes usar PUT o DELETE, pero es mejor no duplicar rutas para evitar confusión
// Uso PUT para mantener semántica de actualización
router.put('/:id/cancelar', pedidosController.cancelarPedido);

router.delete('/:id', pedidosController.cancelarPedido);

module.exports = router;
