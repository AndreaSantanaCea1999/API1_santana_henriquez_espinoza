const { Sucursales, Inventario, Productos } = require('../models');

// ✅ Obtener todas las sucursales
const getAllSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursales.findAll();
    res.status(200).json({
      success: true,
      data: sucursales
    });
  } catch (error) {
    console.error('Error al obtener las sucursales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las sucursales',
      error: error.message
    });
  }
};

// ✅ Obtener una sucursal por ID
const getSucursalById = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursales.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }
    res.status(200).json({
      success: true,
      data: sucursal
    });
  } catch (error) {
    console.error('Error al obtener sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la sucursal',
      error: error.message
    });
  }
};

// ✅ Crear nueva sucursal
const createSucursal = async (req, res) => {
  try {
    const nuevaSucursal = await Sucursales.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Sucursal creada exitosamente',
      data: nuevaSucursal
    });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear la sucursal',
      error: error.message
    });
  }
};

// ✅ Actualizar sucursal
const updateSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursales.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }
    await sucursal.update(req.body);
    res.status(200).json({
      success: true,
      message: 'Sucursal actualizada exitosamente',
      data: sucursal
    });
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la sucursal',
      error: error.message
    });
  }
};

// ✅ Cambiar estado de sucursal (Activa/Inactiva)
const toggleEstadoSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursales.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }
    const nuevoEstado = sucursal.Estado === 'Activa' ? 'Inactiva' : 'Activa';
    await sucursal.update({ Estado: nuevoEstado });
    res.status(200).json({
      success: true,
      message: `Sucursal ${nuevoEstado.toLowerCase()} exitosamente`,
      data: sucursal
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(400).json({
      success: false,
      message: 'Error al cambiar el estado de la sucursal',
      error: error.message
    });
  }
};

// ✅ Obtener inventario de una sucursal
const getInventarioBySucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursales.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }
    const inventario = await Inventario.findAll({
      where: { ID_Sucursal: id },
      include: [{
        model: Productos,
        attributes: ['ID_Producto', 'Codigo', 'Nombre', 'Precio_Venta']
      }],
      order: [[Productos, 'Nombre', 'ASC']]
    });
    res.status(200).json({
      success: true,
      sucursal: sucursal.Nombre,
      count: inventario.length,
      data: inventario
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el inventario de la sucursal',
      error: error.message
    });
  }
};

// ✅ Obtener estadísticas de la sucursal
const getEstadisticasSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursales.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }
    const inventario = await Inventario.findAll({
      where: { ID_Sucursal: id },
      include: [Productos]
    });
    const estadisticas = {
      totalProductos: inventario.length,
      stockTotal: inventario.reduce((sum, item) => sum + item.Stock_Actual, 0),
      productosConStockBajo: inventario.filter(item => item.Stock_Actual <= item.Stock_Minimo).length,
      valorTotalInventario: inventario.reduce((sum, item) => {
        return sum + (item.Stock_Actual * (item.Producto?.Precio_Venta || 0));
      }, 0)
    };
    res.status(200).json({
      success: true,
      sucursal: sucursal.Nombre,
      estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message
    });
  }
};

// ✅ Exportar controladores
module.exports = {
  getAllSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  toggleEstadoSucursal,
  getInventarioBySucursal,
  getEstadisticasSucursal
};
