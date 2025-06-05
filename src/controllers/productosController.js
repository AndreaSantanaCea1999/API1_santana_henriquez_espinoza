// src/controllers/productosController.js

const { Productos, Categorias, Marcas, Proveedores } = require('../models');
const divisasService = require('../services/divisasService');

// GET /api/productos?divisa=<código>
// Obtiene todos los productos, con categorías, marcas y proveedores.
// Si se pasa ?divisa=USD (por ejemplo), convierte el precio de Venta usando divisasService.
exports.getAllProductos = async (req, res) => {
  try {
    const { divisa } = req.query;

    // NOTA: Aquí indicamos explícitamente qué columnas traemos de cada relación.
    const productos = await Productos.findAll({
      include: [
        {
          model: Categorias,
          as: 'categoria',
          // Si no especificas attributes, Sequelize trae todas las columnas de 'categorias'
        },
        {
          model: Marcas,
          as: 'marca',
          // De igual forma, todas las columnas de 'marcas' (ya que tabla 'marcas' sí tiene campo Sitio_Web).
        },
        {
          model: Proveedores,
          as: 'proveedor',
          attributes: [
            'ID_Proveedor',
            'Nombre',
            'RUT',
            'Contacto_Nombre',
            'Contacto_Email',
            'Contacto_Telefono',
            'Direccion',
            'Pais',
            'Tiempo_Entrega_Promedio',
            'Condiciones_Pago',
            'Sitio_Web'
            // NO incluimos 'estado', ni 'Fecha_Creacion' ni 'Ultima_Actualizacion'
          ]
        }
      ]
    });

    // Si no se solicita conversión (o divisa = CLP), devolvemos directo:
    if (!divisa || divisa === 'CLP') {
      return res.status(200).json({
        success: true,
        count: productos.length,
        data: productos
      });
    }

    // Si se solicita otra divisa, hacemos la conversión por cada producto
    const productosConvertidos = [];
    for (const producto of productos) {
      const productoObj = producto.toJSON();
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
      data: productosConvertidos
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener productos',
      message: error.message
    });
  }
};

// GET /api/productos/:id?divisa=<código>
// Obtiene un producto por ID (con categoría, marca y proveedor). Aplica conversión si se pasó ?divisa.
exports.getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const { divisa } = req.query;

    const producto = await Productos.findByPk(id, {
      include: [
        {
          model: Categorias,
          as: 'categoria'
        },
        {
          model: Marcas,
          as: 'marca'
        },
        {
          model: Proveedores,
          as: 'proveedor',
          attributes: [
            'ID_Proveedor',
            'Nombre',
            'RUT',
            'Contacto_Nombre',
            'Contacto_Email',
            'Contacto_Telefono',
            'Direccion',
            'Pais',
            'Tiempo_Entrega_Promedio',
            'Condiciones_Pago',
            'Sitio_Web'
          ]
        }
      ]
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
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
      data: productoResponse
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener el producto',
      message: error.message
    });
  }
};

// POST /api/productos
// Crea un nuevo producto
exports.createProducto = async (req, res) => {
  try {
    const {
      Codigo,
      Nombre,
      ID_Categoria,
      ID_Marca,
      Precio_Venta,
      ...otrosDatos
    } = req.body;

    // Validación mínima de campos obligatorios
    if (!Codigo || !Nombre || !ID_Categoria || !ID_Marca || Precio_Venta === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'Campos obligatorios faltantes: Codigo, Nombre, ID_Categoria, ID_Marca, Precio_Venta'
      });
    }

    // Verificar que no exista un producto con el mismo código
    const codigoExistente = await Productos.findOne({ where: { Codigo } });
    if (codigoExistente) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: `Ya existe un producto con el código ${Codigo}.`
      });
    }

    // Crear el producto
    const nuevoProducto = await Productos.create({
      Codigo,
      Nombre,
      ID_Categoria,
      ID_Marca,
      Precio_Venta,
      ...otrosDatos
    });

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });
  } catch (error) {
    console.error(error);
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
          mensaje: e.message
        }))
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Error al crear el producto',
      message: error.message
    });
  }
};

// PUT /api/productos/:id
// Actualiza un producto existente
exports.updateProducto = async (req, res) => {
  try {
    const producto = await Productos.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Evitar que el ID cambie:
    delete req.body.ID_Producto;

    // Si modican el Código, verificar que no se duplique
    if (req.body.Codigo && req.body.Codigo !== producto.Codigo) {
      const codigoExistente = await Productos.findOne({
        where: { Codigo: req.body.Codigo }
      });
      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          error: 'Error de validación',
          message: `Ya existe otro producto con el código ${req.body.Codigo}.`
        });
      }
    }

    await producto.update(req.body);

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el producto',
      message: error.message
    });
  }
};

// DELETE /api/productos/:id
// Elimina un producto
exports.deleteProducto = async (req, res) => {
  try {
    const producto = await Productos.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await producto.destroy();

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar el producto',
      message: error.message
    });
  }
};
