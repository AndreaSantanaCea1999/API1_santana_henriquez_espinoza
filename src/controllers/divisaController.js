// src/controllers/divisaController.js
const Divisa = require('../models/divisa');

exports.getAll = async (req, res) => {
  try {
    const divisas = await Divisa.findAll();
    res.json(divisas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener divisas', error });
  }
};

exports.create = async (req, res) => {
  try {
    const nueva = await Divisa.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear divisa', error });
  }
};
