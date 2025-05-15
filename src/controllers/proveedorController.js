const Proveedor = require('../models/proveedor');

exports.getAll = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener proveedores', error });
  }
};

exports.create = async (req, res) => {
  try {
    const nuevo = await Proveedor.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear proveedor', error });
  }
};
