const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidosController');

// Rutas CRUD para pedidos
router.get('/', pedidoController.getAllPedidos);
router.get('/estadisticas', pedidoController.getEstadisticasPedidos);
router.get('/:id', pedidoController.getPedidoById);
router.post('/', pedidoController.createPedido);
router.put('/:id/estado', pedidoController.updateEstadoPedido);
router.delete('/:id', pedidoController.cancelarPedido);

module.exports = router;