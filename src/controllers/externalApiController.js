// src/controllers/externalApiController.js
const { Productos, Categorias, Marcas, Proveedores, Inventario } = require('../models');
const divisasService = require('../services/divisasService');

// Endpoint específico para consultas externas según formato del anexo
exports.getProductoFormatoExterno = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { divisa = 'CLP' } = req.query;

    const producto = await Productos.findOne({
      where: { Codigo: codigo },
      include: [
        { model: Marcas, as: 'marca' },
        { model: Categorias, as: 'categoria' },
        { model: Inventario, as: 'inventarios' }
      ]
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Formato específico según anexo FERREMAS
    let precioArray = [{
      "Fecha": new Date().toISOString(),
      "Valor": parseFloat(producto.Precio_Venta)
    }];

    // Conversión de divisa si es necesaria
    if (divisa !== 'CLP') {
      try {
        const conversion = await divisasService.obtenerPrecioEnDivisa(
          producto.Precio_Venta,
          'CLP',
          divisa
        );
        precioArray[0].Valor = conversion.montoConvertido;
        precioArray[0].Divisa = divisa;
        precioArray[0].TasaCambio = conversion.tasaCambio;
      } catch (error) {
        console.error('Error en conversión de divisa:', error.message);
      }
    }

    const respuestaExterna = {
      "Código del producto": producto.Codigo,
      "Marca": producto.marca?.Nombre || null,
      "Código": `${producto.marca?.Nombre?.substring(0,3).toUpperCase()}-${producto.ID_Producto}`,
      "Nombre": producto.Nombre,
      "Precio": precioArray,
      "Stock": producto.inventarios?.reduce((total, inv) => total + inv.Stock_Actual, 0) || 0,
      "Categoria": producto.categoria?.Nombre || null
    };

    return res.status(200).json(respuestaExterna);
  } catch (error) {
    console.error('Error en consulta externa:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};

// Catálogo completo para tiendas externas
exports.getCatalogoExterno = async (req, res) => {
  try {
    const { categoria, marca, divisa = 'CLP', page = 1, limit = 50 } = req.query;
    
    let whereClause = { Estado: 'Activo' };
    let includeClause = [
      { model: Marcas, as: 'marca' },
      { model: Categorias, as: 'categoria' },
      { model: Inventario, as: 'inventarios' }
    ];

    if (categoria) {
      includeClause[1].where = { Nombre: categoria };
    }
    
    if (marca) {
      includeClause[0].where = { Nombre: marca };
    }

    const offset = (page - 1) * limit;
    
    const productos = await Productos.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['Nombre', 'ASC']]
    });

    const productosFormateados = await Promise.all(
      productos.rows.map(async (producto) => {
        let precio = parseFloat(producto.Precio_Venta);
        
        // Conversión de divisa si es necesaria
        if (divisa !== 'CLP') {
          try {
            const conversion = await divisasService.obtenerPrecioEnDivisa(precio, 'CLP', divisa);
            precio = conversion.montoConvertido;
          } catch (error) {
            console.error('Error en conversión:', error.message);
          }
        }

        return {
          "Código del producto": producto.Codigo,
          "Marca": producto.marca?.Nombre || null,
          "Código": `${producto.marca?.Nombre?.substring(0,3).toUpperCase()}-${producto.ID_Producto}`,
          "Nombre": producto.Nombre,
          "Precio": [{
            "Fecha": new Date().toISOString(),
            "Valor": precio
          }],
          "Stock": producto.inventarios?.reduce((total, inv) => total + inv.Stock_Actual, 0) || 0,
          "Categoria": producto.categoria?.Nombre || null
        };
      })
    );

    return res.status(200).json({
      success: true,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(productos.count / limit),
        totalItems: productos.count,
        itemsPerPage: parseInt(limit)
      },
      productos: productosFormateados
    });
  } catch (error) {
    console.error('Error en catálogo externo:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};