const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
// Rutas CRUD para pedidos
router.get('/', pedidosController.getAllPedidos);
router.get('/estadisticas', pedidosController.getEstadisticasPedidos);
router.get('/:id', pedidosController.getPedidoById);
router.post('/', pedidosController.createPedido);
router.put('/:id/estado', pedidosController.updateEstadoPedido);
router.put('/pedidos/:id/cancelar', pedidosController.cancelarPedido);
// router.patch('/:idPedido/detalles/estado', pedidosController.actualizarEstadoDetalles); // Esta línea parece referenciar una función no existente en el controlador
router.delete('/:id', pedidosController.cancelarPedido);

module.exports = router;