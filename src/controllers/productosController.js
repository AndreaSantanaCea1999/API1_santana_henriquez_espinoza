const { Proveedores } = require('../models');

// Obtener todos los proveedores
exports.getAllProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedores.findAll();
    res.status(200).json({
      success: true,
      count: proveedores.length,
      data: proveedores
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener proveedores',
      message: error.message
    });
  }
};

// Obtener un proveedor por ID
exports.getProveedorById = async (req, res) => {
  try {
    const proveedor = await Proveedores.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: proveedor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el proveedor',
      message: error.message
    });
  }
};

// Crear un nuevo proveedor
exports.createProveedor = async (req, res) => {
  try {
    // Transformación de datos para asegurar que RUT está presente
    const proveedorData = {
      ...req.body
    };
    
    // Si el cliente envió 'rut' en minúsculas, lo convertimos a 'RUT'
    if (req.body.rut && !req.body.RUT) {
      proveedorData.RUT = req.body.rut;
      delete proveedorData.rut; // Eliminamos el campo en minúsculas
    }
    
    // Verificar que RUT existe
    if (!proveedorData.RUT) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'El RUT del proveedor es obligatorio'
      });
    }
    
    const nuevoProveedor = await Proveedores.create(proveedorData);
    
    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: nuevoProveedor
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      error: 'Error al crear proveedor',
      message: error.message
    });
  }
};

// Actualizar un proveedor
exports.updateProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedores.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Misma transformación para actualizaciones
    const proveedorData = {
      ...req.body
    };
    
    if (req.body.rut && !req.body.RUT) {
      proveedorData.RUT = req.body.rut;
      delete proveedorData.rut;
    }
    
    await proveedor.update(proveedorData);
    
    res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: proveedor
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      error: 'Error al actualizar el proveedor',
      message: error.message
    });
  }
};

// Eliminar un proveedor
exports.deleteProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedores.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    await proveedor.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el proveedor',
      message: error.message
    });
  }
};