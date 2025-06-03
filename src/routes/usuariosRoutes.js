const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuariosController');

// Rutas CRUD para usuarios
router.get('/', usuarioController.getAllUsuarios);
router.get('/estadisticas', usuarioController.getEstadisticasUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);

module.exports = router;