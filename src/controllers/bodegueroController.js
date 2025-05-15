const Bodeguero = require('../models/bodeguero');

exports.getAll = async (req, res) => {
  const bodegueros = await Bodeguero.findAll();
  res.json(bodegueros);
};

exports.create = async (req, res) => {
  const nuevo = await Bodeguero.create(req.body);
  res.status(201).json(nuevo);
};
