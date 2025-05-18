const { Inventario, Productos } = require('../models');

// Obtener todo el inventario
exports.getAllInventario = async (req, res) => {
  try {
    const inventario = await Inventario.findAll({
      include: [{ model: Productos, as: 'producto' }]
    });
    
    res.status(200).json({
      success: true,
      count: inventario.length,
      data: inventario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el inventario',
      error: error.message
    });
  }
};

// Obtener inventario por ID
exports.getInventarioById = async (req, res) => {
  try {
    const inventario = await Inventario.findByPk(req.params.id, {
      include: [{ model: Productos, as: 'producto' }]
    });
    
    if (!inventario) {
      return res.status(404).json({
        success: false,
        message: 'Inventario no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: inventario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el inventario',
      error: error.message
    });
  }
};

// Crear un nuevo registro de inventario
exports.createInventario = async (req, res) => {
  try {
    const nuevoInventario = await Inventario.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Registro de inventario creado exitosamente',
      data: nuevoInventario
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: 'Error al crear el registro de inventario',
      error: error.message
    });
  }
};

// Actualizar un registro de inventario
exports.updateInventario = async (req, res) => {
  try {
    const inventario = await Inventario.findByPk(req.params.id);
    
    if (!inventario) {
      return res.status(404).json({
        success: false,
        message: 'Registro de inventario no encontrado'
      });
    }
    
    await inventario.update(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Registro de inventario actualizado exitosamente',
      data: inventario
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el registro de inventario',
      error: error.message
    });
  }
};

// Eliminar un registro de inventario
exports.deleteInventario = async (req, res) => {
  try {
    const inventario = await Inventario.findByPk(req.params.id);
    
    if (!inventario) {
      return res.status(404).json({
        success: false,
        message: 'Registro de inventario no encontrado'
      });
    }
    
    await inventario.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Registro de inventario eliminado exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el registro de inventario',
      error: error.message
    });
  }
};

// Obtener inventario por ID de producto
exports.getInventarioByProducto = async (req, res) => {
  try {
    const inventario = await Inventario.findAll({
      where: { ID_Producto: req.params.productoId },
      include: [{ model: Productos, as: 'producto' }]
    });
    
    res.status(200).json({
      success: true,
      count: inventario.length,
      data: inventario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el inventario del producto',
      error: error.message
    });
  }
};