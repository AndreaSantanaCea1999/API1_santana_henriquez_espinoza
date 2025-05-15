const Cliente = require('../models/cliente');

exports.getAll = async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener clientes', error });
  }
};

exports.create = async (req, res) => {
  try {
    const nuevo = await Cliente.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear cliente', error });
  }
};
