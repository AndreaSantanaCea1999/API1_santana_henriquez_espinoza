const { Inventario, Productos, Sucursales } = require('../models');

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

// Obtener o crear inventario por producto y sucursal
exports.getInventarioByProductoAndSucursal = async (req, res) => {
  try {
    const { productoId, sucursalId } = req.params;

    // Buscar inventario
    let inventario = await Inventario.findOne({
      where: {
        ID_Producto: productoId,
        ID_Sucursal: sucursalId
      },
      include: [{
        model: Productos,
        attributes: ['Codigo', 'Nombre', 'Precio_Venta']
      }]
    });

    // Si no existe, lo crea con valores por defecto
    if (!inventario) {
      const producto = await Productos.findByPk(productoId);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado',
          ID_Producto: productoId
        });
      }

      const sucursal = await Sucursales.findByPk(sucursalId);
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada',
          ID_Sucursal: sucursalId
        });
      }

      inventario = await Inventario.create({
        ID_Producto: productoId,
        ID_Sucursal: sucursalId,
        Stock_Actual: 0,
        Stock_Minimo: 10,
        Stock_Maximo: 100,
        Stock_Reservado: 0,
        Punto_Reorden: 20
      });

      inventario = await Inventario.findOne({
        where: {
          ID_Producto: productoId,
          ID_Sucursal: sucursalId
        },
        include: [{
          model: Productos,
          attributes: ['Codigo', 'Nombre', 'Precio_Venta']
        }]
      });
    }

    res.status(200).json(inventario);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
