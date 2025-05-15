const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.get('/', pedidoController.getAll);
router.post('/', pedidoController.create);

module.exports = router;
