const Producto = require('../models/producto');

exports.getAll = async (req, res) => {
  const productos = await Producto.findAll();
  res.json(productos);
};

exports.create = async (req, res) => {
  const producto = await Producto.create(req.body);
  res.status(201).json(producto);
};
