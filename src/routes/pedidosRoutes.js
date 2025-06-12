const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
// Rutas CRUD para pedidos
router.get('/', pedidoController.getAllPedidos);
router.get('/estadisticas', pedidoController.getEstadisticasPedidos);
router.get('/:id', pedidoController.getPedidoById);
router.post('/', pedidoController.createPedido);
router.put('/:id/estado', pedidosController.updateEstadoPedido);
router.put('/pedidos/:id/cancelar', pedidosController.cancelarPedido);
router.patch('/:idPedido/detalles/estado', pedidosController.actualizarEstadoDetalles);
router.delete('/:id', pedidosController.cancelarPedido);

module.exports = router;