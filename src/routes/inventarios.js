const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

router.get('/', inventarioController.getAll);
router.get('/:id', inventarioController.getById);
router.post('/', inventarioController.create);
router.put('/:id', inventarioController.update);
router.delete('/:id', inventarioController.delete);

module.exports = router;
