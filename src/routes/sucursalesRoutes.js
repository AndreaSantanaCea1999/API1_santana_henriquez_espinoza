const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');

// Rutas básicas de sucursales
router.get('/', sucursalesController.getAllSucursales);
router.get('/:id', sucursalesController.getSucursalById);
router.post('/', sucursalesController.createSucursal);
router.put('/:id', sucursalesController.updateSucursal);
router.patch('/:id/estado', sucursalesController.toggleEstadoSucursal);
router.delete('/:id', sucursalesController.deleteSucursal); // Nueva ruta para eliminación física

// Rutas adicionales
router.get('/:id/inventario', sucursalesController.getInventarioBySucursal);
router.get('/:id/estadisticas', sucursalesController.getEstadisticasSucursal);

module.exports = router;
