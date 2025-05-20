const { Productos, Categorias, Marcas, Proveedores } = require('../models');
const divisasService = require('../services/divisasService');

// Obtener todos los productos (con soporte de divisas)
exports.getAllProductos = async (req, res) => {
  try {
    const { divisa } = req.query;

    const productos = await Productos.findAll({
      include: [
        { model: Categorias, as: 'categoria' },
        { model: Marcas, as: 'marca' },
        { model: Proveedores, as: 'proveedor' },
      ],
    });

    if (!divisa || divisa === 'CLP') {
      return res.status(200).json({
        success: true,
        count: productos.length,
        data: productos,
      });
    }

    const productosConvertidos = [];

    for (const producto of productos) {
      let productoObj = producto.toJSON();

      try {
        const conversion = await divisasService.obtenerPrecioEnDivisa(
          producto.Precio_Venta,
          'CLP',
          divisa
        );

        productoObj.Precio_Original = producto.Precio_Venta;
        productoObj.Divisa_Original = 'CLP';
        productoObj.Precio_Venta_Convertido = conversion.montoConvertido;
        productoObj.Divisa_Convertida = divisa;
        productoObj.Tasa_Cambio = conversion.tasaCambio;
        productoObj.Fecha_Cambio = conversion.fecha;
      } catch (error) {
        console.error(`Error al convertir producto ${producto.ID_Producto}:`, error.message);
      }

      productosConvertidos.push(productoObj);
    }

    return res.status(200).json({
      success: true,
      count: productosConvertidos.length,
      data: productosConvertidos,
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

// Obtener un producto por ID (con soporte de divisas)
exports.getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const { divisa } = req.query;

    const producto = await Productos.findByPk(id, {
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

    let productoResponse = producto.toJSON();

    if (divisa && divisa !== 'CLP') {
      try {
        const conversion = await divisasService.obtenerPrecioEnDivisa(
          producto.Precio_Venta,
          'CLP',
          divisa
        );

        productoResponse.Precio_Original = producto.Precio_Venta;
        productoResponse.Divisa_Original = 'CLP';
        productoResponse.Precio_Venta_Convertido = conversion.montoConvertido;
        productoResponse.Divisa_Convertida = divisa;
        productoResponse.Tasa_Cambio = conversion.tasaCambio;
        productoResponse.Fecha_Cambio = conversion.fecha;
      } catch (error) {
        console.error('Error al convertir precio:', error.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: productoResponse,
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
    const { Codigo, Nombre, ID_Categoria, ID_Marca, Precio_Venta, ...otrosDatos } = req.body;

    if (!Codigo || !Nombre || !ID_Categoria || !ID_Marca || Precio_Venta === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'Campos obligatorios faltantes: Codigo, Nombre, ID_Categoria, ID_Marca, Precio_Venta',
      });
    }

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

    delete req.body.ID_Producto;

    if (req.body.Codigo && req.body.Codigo !== producto.Codigo) {
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
