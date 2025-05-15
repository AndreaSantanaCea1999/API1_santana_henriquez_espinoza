const Marca = require('../models/marca');

exports.getAll = async (req, res) => {
  try {
    const marcas = await Marca.findAll();
    res.json(marcas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener marcas', error });
  }
};

exports.create = async (req, res) => {
  try {
    const nueva = await Marca.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear marca', error });
  }
};
