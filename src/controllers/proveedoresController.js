const { Proveedores, Productos } = require('../models');

// Obtener todos los proveedores
exports.getAllProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedores.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    return res.status(200).json({
      success: true,
      count: proveedores.length,
      data: proveedores,
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener proveedores',
      message: error.message,
    });
  }
};

// Obtener un proveedor por ID (con productos relacionados)
exports.getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedores.findByPk(id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [
        {
          model: Productos,
          as: 'productos',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
    });

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: proveedor,
    });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener proveedor',
      message: error.message,
    });
  }
};

// Crear un nuevo proveedor
exports.createProveedor = async (req, res) => {
  try {
    const { ID_Proveedor, RUT, ...otrosDatos } = req.body;

    // 1. Validar que se proporcione ID_Proveedor
    if (ID_Proveedor === undefined || ID_Proveedor === null) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'El campo ID_Proveedor es obligatorio.',
      });
    }

    // 2. Verificar si ya existe un proveedor con ese ID_Proveedor
    const idExistente = await Proveedores.findByPk(ID_Proveedor);
    if (idExistente) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: `Ya existe un proveedor con el ID_Proveedor ${ID_Proveedor}.`,
      });
    }

    // Normalizar campo RUT a mayúsculas para evitar duplicados por case sensitive
    let rutNormalizado = RUT;
    if (rutNormalizado) {
      rutNormalizado = rutNormalizado.toUpperCase();
    }

    // 3. Verifica si ya existe un proveedor con ese RUT
    const rutExistente = await Proveedores.findOne({
      where: { RUT: rutNormalizado },
    });

    if (rutExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un proveedor con ese RUT',
      });
    }
    const nuevoProveedor = await Proveedores.create({ ID_Proveedor, RUT: rutNormalizado, ...otrosDatos });

    return res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: nuevoProveedor,
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);

    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: error.message,
        errores: error.errors.map((e) => ({
          campo: e.path,
          tipo: e.type,
          mensaje: e.message,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error al crear proveedor',
      message: error.message,
    });
  }
};

// Actualizar un proveedor
exports.updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalizar RUT a mayúsculas si viene en la actualización
    if (req.body.RUT) {
      req.body.RUT = req.body.RUT.toUpperCase();
    }

    const proveedor = await Proveedores.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    // Validar que no se duplique RUT si se cambia
    if (req.body.RUT && req.body.RUT !== proveedor.RUT) {
      const proveedorExistente = await Proveedores.findOne({
        where: { RUT: req.body.RUT },
      });

      if (proveedorExistente) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un proveedor con ese RUT',
        });
      }
    }

    // No permitir modificar el ID
    delete req.body.ID_Proveedor;

    await proveedor.update(req.body);

    return res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: proveedor,
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar proveedor',
      message: error.message,
    });
  }
};

// Eliminar un proveedor (con validación de productos asociados)
exports.deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedores.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    // Verifica si tiene productos asociados
    const productosAsociados = await Productos.findOne({
      where: { ID_Proveedor: id },
    });

    if (productosAsociados) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el proveedor porque tiene productos asociados',
      });
    }

    await proveedor.destroy();

    return res.status(200).json({
      success: true,
      message: 'Proveedor eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar proveedor',
      message: error.message,
    });
  }
};
