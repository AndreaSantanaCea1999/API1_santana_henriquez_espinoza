const Inventario = require('../models/inventario');

exports.getAll = async (req, res) => {
  try {
    const inventarios = await Inventario.findAll();
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener inventarios', error });
  }
};

exports.getById = async (req, res) => {
  try {
    const inventario = await Inventario.findByPk(req.params.id);
    if (!inventario) return res.status(404).json({ message: 'Inventario no encontrado' });
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener inventario', error });
  }
};

exports.create = async (req, res) => {
  try {
    const nuevoInventario = await Inventario.create(req.body);
    res.status(201).json(nuevoInventario);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear inventario', error });
  }
};

exports.update = async (req, res) => {
  try {
    const inventario = await Inventario.findByPk(req.params.id);
    if (!inventario) return res.status(404).json({ message: 'Inventario no encontrado' });
    await inventario.update(req.body);
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar inventario', error });
  }
};

exports.delete = async (req, res) => {
  try {
    const inventario = await Inventario.findByPk(req.params.id);
    if (!inventario) return res.status(404).json({ message: 'Inventario no encontrado' });
    await inventario.destroy();
    res.json({ message: 'Inventario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar inventario', error });
  }
};
