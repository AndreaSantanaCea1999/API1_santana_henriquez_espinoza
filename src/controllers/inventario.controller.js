const InventarioModel = require('../models/inventario.model');

// Obtener todo el inventario con detalles
exports.getAllInventario = async (req, res) => {
  try {
    const inventario = await InventarioModel.findAllWithDetails();
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener el inventario:', err);
    res.status(500).json({ message: 'Error al obtener el inventario' });
  }
};

// Obtener inventario por ID con detalles
exports.getInventarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const inventario = await InventarioModel.findByIdWithDetails(id);
    if (!inventario) {
      return res.status(404).json({ message: 'Inventario no encontrado' });
    }
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener inventario por ID:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener inventario de una sucursal
exports.getInventarioBySucursal = async (req, res) => {
  try {
    const { idSucursal } = req.params;
    const inventario = await InventarioModel.findBySucursalId(idSucursal);
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener inventario por sucursal:', err);
    res.status(500).json({ message: 'Error al obtener inventario por sucursal' });
  }
};

// Obtener inventario de un producto
exports.getInventarioByProducto = async (req, res) => {
  try {
    const { idProducto } = req.params;
    const inventario = await InventarioModel.findByProductoId(idProducto);
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener inventario por producto:', err);
    res.status(500).json({ message: 'Error al obtener inventario por producto' });
  }
};

// Obtener stock por producto y sucursal
exports.getInventarioStockByProductoAndSucursal = async (req, res) => {
  try {
    const { productoId, sucursalId } = req.query;

    if (!productoId || !sucursalId) {
      return res.status(400).json({ message: 'Se requieren productoId y sucursalId como parámetros' });
    }

    const inventario = await InventarioModel.findExistingInventario(productoId, sucursalId);

    if (!inventario) {
      return res.status(404).json({ message: 'Inventario no encontrado para ese producto y sucursal' });
    }

    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener stock por producto y sucursal:', err);
    res.status(500).json({ message: 'Error al obtener stock' });
  }
};

// Crear nuevo inventario
exports.createInventario = async (req, res) => {
  try {
    const id = await InventarioModel.create(req.body);
    res.status(201).json({ message: 'Inventario creado correctamente', ID_Inventario: id });
  } catch (err) {
    console.error('Error al crear inventario:', err);
    res.status(500).json({ message: 'Error al crear inventario' });
  }
};

// Actualizar campos generales del inventario
exports.updateInventarioFields = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await InventarioModel.updateGeneralFields(id, updateData);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inventario no encontrado' });
    }

    res.json({ message: 'Inventario actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar inventario:', err);
    res.status(500).json({ message: 'Error al actualizar inventario' });
  }
};

// Crear movimiento de inventario
exports.createMovimientoInventario = async (req, res) => {
  try {
    const { id } = req.params;
    const movimientoData = { ...req.body, ID_Inventario: id };
    const idMovimiento = await InventarioModel.createMovimiento(movimientoData);
    res.status(201).json({ message: 'Movimiento registrado', ID_Movimiento: idMovimiento });
  } catch (err) {
    console.error('Error al crear movimiento:', err);
    res.status(500).json({ message: 'Error al registrar movimiento' });
  }
};

// Eliminar inventario
exports.deleteInventario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InventarioModel.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inventario no encontrado' });
    }
    res.json({ message: 'Inventario eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar inventario:', err);
    res.status(500).json({ message: 'Error al eliminar inventario' });
  }
};
