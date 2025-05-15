const Movimiento = require('../models/movimientoInventario');

exports.getAll = async (req, res) => {
  const movimientos = await Movimiento.findAll();
  res.json(movimientos);
};

exports.create = async (req, res) => {
  const nuevo = await Movimiento.create(req.body);
  res.status(201).json(nuevo);
};
