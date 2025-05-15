const Sucursal = require('../models/sucursal');

exports.getAll = async (req, res) => {
  const sucursales = await Sucursal.findAll();
  res.json(sucursales);
};

exports.create = async (req, res) => {
  const sucursal = await Sucursal.create(req.body);
  res.status(201).json(sucursal);
};
