const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController'); // nombre corregido

// Rutas CRUD para proveedores
router.get('/', proveedoresController.getAllProveedores);
router.get('/:id', proveedoresController.getProveedorById);
router.post('/', proveedoresController.createProveedor);
router.put('/:id', proveedoresController.updateProveedor);
router.delete('/:id', proveedoresController.deleteProveedor);

module.exports = router;
