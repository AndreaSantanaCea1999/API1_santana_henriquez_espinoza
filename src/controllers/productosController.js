const { Productos, Categorias, Marcas, Proveedores } = require('../models'); // Importar los modelos necesarios

// Obtener todos los productos
exports.getAllProductos = async (req, res) => {
  try {
    const productos = await Productos.findAll({
      include: [ // Incluir relaciones si es necesario
        { model: Categorias, as: 'categoria' },
        { model: Marcas, as: 'marca' },
        { model: Proveedores, as: 'proveedor' },
      ],
    });
    return res.status(200).json({
      success: true,
      count: productos.length,
      data: productos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener productos',
      message: error.message,
    });
  }
};

// Obtener un producto por ID
exports.getProductoById = async (req, res) => {
  try {
    const producto = await Productos.findByPk(req.params.id, {
      include: [
        { model: Categorias, as: 'categoria' },
        { model: Marcas, as: 'marca' },
        { model: Proveedores, as: 'proveedor' },
      ],
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: producto,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener el producto',
      message: error.message,
    });
  }
};

// Crear un nuevo producto
exports.createProducto = async (req, res) => {
  try {
    // ID_Producto es auto-incremental, no se envía en el body
    const { Codigo, Nombre, ID_Categoria, ID_Marca, Precio_Venta, ...otrosDatos } = req.body;

    // Validaciones básicas (puedes añadir más)
    if (!Codigo || !Nombre || !ID_Categoria || !ID_Marca || Precio_Venta === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'Campos obligatorios faltantes: Codigo, Nombre, ID_Categoria, ID_Marca, Precio_Venta',
      });
    }

    // Verificar si el código de producto ya existe
    const codigoExistente = await Productos.findOne({ where: { Codigo } });
    if (codigoExistente) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: `Ya existe un producto con el código ${Codigo}.`,
      });
    }

    const nuevoProducto = await Productos.create({
      Codigo,
      Nombre,
      ID_Categoria,
      ID_Marca,
      Precio_Venta,
      ...otrosDatos,
    });

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto,
    });
  } catch (error) {
    console.error(error);
    // Manejo de errores de Sequelize (validación, unicidad)
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
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
      error: 'Error al crear el producto',
      message: error.message,
    });
  }
};

// Actualizar un producto
exports.updateProducto = async (req, res) => {
  try {
    const producto = await Productos.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    // No permitir modificar el ID_Producto ni el Codigo (generalmente el código es inmutable o se maneja con cuidado)
    delete req.body.ID_Producto;
    if (req.body.Codigo && req.body.Codigo !== producto.Codigo) {
        // Opcional: Validar si el nuevo código ya existe para otro producto
        const codigoExistente = await Productos.findOne({ where: { Codigo: req.body.Codigo } });
        if (codigoExistente) {
            return res.status(400).json({
                success: false,
                error: 'Error de validación',
                message: `Ya existe otro producto con el código ${req.body.Codigo}.`,
            });
        }
    }

    await producto.update(req.body);

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto,
    });
  } catch (error) {
    console.error(error);
    // Similar manejo de errores de validación que en createProducto
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el producto',
      message: error.message,
    });
  }
};

// Eliminar un producto
exports.deleteProducto = async (req, res) => {
  try {
    const producto = await Productos.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    // Opcional: Verificar si el producto está en algún inventario antes de eliminar
    // const inventarioAsociado = await Inventario.findOne({ where: { ID_Producto: req.params.id } });
    // if (inventarioAsociado) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'No se puede eliminar el producto porque tiene registros de inventario asociados.',
    //   });
    // }

    await producto.destroy();

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar el producto',
      message: error.message,
    });
  }
};