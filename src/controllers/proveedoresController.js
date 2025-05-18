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

// Obtener un proveedor por ID (incluye productos relacionados)
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
    const proveedorData = { ...req.body };

    // Estandariza el campo RUT
    if (req.body.rut && !req.body.RUT) {
      proveedorData.RUT = req.body.rut;
      delete proveedorData.rut;
    }

    // Verifica si ya existe un proveedor con ese RUT
    const proveedorExistente = await Proveedores.findOne({
      where: { RUT: proveedorData.RUT },
    });

    if (proveedorExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un proveedor con ese RUT',
      });
    }

    // Obtener el próximo ID (si no se usa autoIncrement)
    const maxId = await Proveedores.max('ID_Proveedor');
    const nextId = (maxId !== null ? maxId : 0) + 1;

    const nuevoProveedor = await Proveedores.create({
      ID_Proveedor: nextId,
      ...proveedorData,
    });

    return res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: nuevoProveedor,
    });
  } catch (error) {
    console.error('Error completo:', error);

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
    const updateData = { ...req.body };

    const proveedor = await Proveedores.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    // Validar duplicación de RUT si lo están cambiando
    if (updateData.RUT && updateData.RUT !== proveedor.RUT) {
      const proveedorExistente = await Proveedores.findOne({
        where: { RUT: updateData.RUT },
      });

      if (proveedorExistente) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un proveedor con ese RUT',
        });
      }
    }

    delete updateData.ID_Proveedor; // Prevenir actualización de la clave primaria

    await proveedor.update(updateData);

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

// Eliminar un proveedor
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
