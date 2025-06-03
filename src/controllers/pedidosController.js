const { sequelize, Pedidos, DetallesPedido, Productos, Usuario, Inventario, MovimientosInventario } = require('../models');
const { Op } = require('sequelize');

// Generar código único para el pedido
const generarCodigoPedido = async () => {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getDate().toString().padStart(2, '0');
  
  const ultimoPedido = await Pedidos.findOne({
    where: {
      Codigo_Pedido: {
        [Op.like]: `PED${año}${mes}${dia}%`
      }
    },
    order: [['Codigo_Pedido', 'DESC']]
  });
  
  let numero = 1;
  if (ultimoPedido) {
    const ultimoNumero = parseInt(ultimoPedido.Codigo_Pedido.slice(-3));
    numero = ultimoNumero + 1;
  }
  
  return `PED${año}${mes}${dia}${numero.toString().padStart(3, '0')}`;
};

// Obtener todos los pedidos
exports.getAllPedidos = async (req, res) => {
  try {
    const { estado, cliente, fechaInicio, fechaFin, page = 1, limit = 20 } = req.query;
    
    let whereClause = {};
    
    if (estado) whereClause.Estado = estado;
    if (cliente) whereClause.ID_Cliente = cliente;
    if (fechaInicio && fechaFin) {
      whereClause.Fecha_Pedido = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: pedidos } = await Pedidos.findAndCountAll({
      where: whereClause,
      include: [
        { model: Usuario, as: 'cliente', attributes: ['ID_Usuario', 'Nombre', 'Email'] },
        { model: Usuario, as: 'vendedor', attributes: ['ID_Usuario', 'Nombre'], required: false },
        { 
          model: DetallesPedido, 
          as: 'detalles',
          include: [{ model: Productos, as: 'producto', attributes: ['Codigo', 'Nombre'] }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['Fecha_Pedido', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: pedidos.length,
      totalCount: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: pedidos
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener pedidos',
      message: error.message
    });
  }
};

// Obtener un pedido por ID
exports.getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedido = await Pedidos.findByPk(id, {
      include: [
        { model: Usuario, as: 'cliente', attributes: ['ID_Usuario', 'Nombre', 'Email', 'RUT', 'Telefono'] },
        { model: Usuario, as: 'vendedor', attributes: ['ID_Usuario', 'Nombre'], required: false },
        { 
          model: DetallesPedido, 
          as: 'detalles',
          include: [{ model: Productos, as: 'producto' }]
        }
      ]
    });
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: pedido
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener pedido',
      message: error.message
    });
  }
};

// Crear un nuevo pedido
exports.createPedido = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      ID_Cliente,
      ID_Vendedor,
      ID_Sucursal = 1,
      Canal = 'Online',
      Metodo_Entrega = 'Despacho_Domicilio',
      Direccion_Entrega,
      Ciudad_Entrega,
      Region_Entrega,
      Comentarios,
      detalles = []
    } = req.body;
    
    if (!ID_Cliente || !detalles.length) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'ID_Cliente y detalles son obligatorios'
      });
    }
    
    // Verificar cliente
    const cliente = await Usuario.findByPk(ID_Cliente, { transaction: t });
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Verificar stock y calcular totales
    let subtotal = 0;
    let impuestosTotal = 0;
    const detallesValidados = [];
    
    for (const detalle of detalles) {
      const { ID_Producto, Cantidad, Descuento = 0 } = detalle;
      
      const producto = await Productos.findByPk(ID_Producto, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          error: `Producto con ID ${ID_Producto} no encontrado`
        });
      }
      
      // Verificar stock
      const inventario = await Inventario.findOne({
        where: { ID_Producto, ID_Sucursal },
        transaction: t
      });
      
      if (!inventario || inventario.Stock_Actual < Cantidad) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${producto.Nombre}`
        });
      }
      
      // Calcular precios
      const precioUnitario = parseFloat(producto.Precio_Venta);
      const descuentoLinea = parseFloat(Descuento) || 0;
      const impuestoPorcentaje = parseFloat(producto.Tasa_Impuesto) || 19;
      
      const subtotalLinea = (precioUnitario * Cantidad) - descuentoLinea;
      const impuestoLinea = (subtotalLinea * impuestoPorcentaje) / 100;
      
      subtotal += subtotalLinea;
      impuestosTotal += impuestoLinea;
      
      detallesValidados.push({
        ID_Producto,
        Cantidad,
        Precio_Unitario: precioUnitario,
        Descuento: descuentoLinea,
        Impuesto: impuestoLinea,
        Subtotal: subtotalLinea + impuestoLinea
      });
    }
    
    const total = subtotal + impuestosTotal;
    const codigoPedido = await generarCodigoPedido();
    
    // Crear pedido
    const nuevoPedido = await Pedidos.create({
      Codigo_Pedido: codigoPedido,
      ID_Cliente,
      ID_Vendedor,
      ID_Sucursal,
      Canal,
      Estado: 'Pendiente',
      Metodo_Entrega,
      Direccion_Entrega,
      Ciudad_Entrega,
      Region_Entrega,
      Comentarios,
      Subtotal: subtotal,
      Descuento: 0,
      Impuestos: impuestosTotal,
      Costo_Envio: 0,
      Total: total,
      ID_Divisa: 1,
      Fecha_Estimada_Entrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }, { transaction: t });
    
    // Crear detalles y reservar stock
    for (const detalle of detallesValidados) {
      await DetallesPedido.create({
        ID_Pedido: nuevoPedido.ID_Pedido,
        ...detalle
      }, { transaction: t });
      
      // Reservar stock
      const inventario = await Inventario.findOne({
        where: { ID_Producto: detalle.ID_Producto, ID_Sucursal },
        transaction: t
      });
      
      await inventario.update({
        Stock_Actual: inventario.Stock_Actual - detalle.Cantidad,
        Stock_Reservado: inventario.Stock_Reservado + detalle.Cantidad,
        Ultima_Actualizacion: new Date()
      }, { transaction: t });
      
      // Crear movimiento
      await MovimientosInventario.create({
        ID_Inventario: inventario.ID_Inventario,
        Tipo_Movimiento: 'Reserva',
        Cantidad: detalle.Cantidad,
        ID_Pedido: nuevoPedido.ID_Pedido,
        Comentario: `Reserva para pedido ${codigoPedido}`
      }, { transaction: t });
    }
    
    await t.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: nuevoPedido
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear pedido:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear pedido',
      message: error.message
    });
  }
};

// Actualizar estado de un pedido
exports.updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { Estado } = req.body;
    
    const estadosValidos = ['Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto'];
    
    if (!Estado || !estadosValidos.includes(Estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido'
      });
    }
    
    const pedido = await Pedidos.findByPk(id);
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
    
    const estadoAnterior = pedido.Estado;
    await pedido.update({ Estado });
    
    return res.status(200).json({
      success: true,
      message: `Estado actualizado de ${estadoAnterior} a ${Estado}`,
      data: {
        ID_Pedido: pedido.ID_Pedido,
        Codigo_Pedido: pedido.Codigo_Pedido,
        Estado_Anterior: estadoAnterior,
        Estado_Nuevo: Estado
      }
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar estado del pedido',
      message: error.message
    });
  }
};

// Cancelar un pedido
exports.cancelarPedido = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { motivo = 'Cancelado por el usuario' } = req.body;
    
    const pedido = await Pedidos.findByPk(id, {
      include: [{ model: DetallesPedido, as: 'detalles' }],
      transaction: t
    });
    
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
    
    if (['Entregado', 'Cancelado'].includes(pedido.Estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede cancelar un pedido en estado ${pedido.Estado}`
      });
    }
    
    // Liberar stock reservado
    for (const detalle of pedido.detalles) {
      const inventario = await Inventario.findOne({
        where: { ID_Producto: detalle.ID_Producto, ID_Sucursal: pedido.ID_Sucursal },
        transaction: t
      });
      
      if (inventario) {
        await inventario.update({
          Stock_Actual: inventario.Stock_Actual + detalle.Cantidad,
          Stock_Reservado: Math.max(0, inventario.Stock_Reservado - detalle.Cantidad),
          Ultima_Actualizacion: new Date()
        }, { transaction: t });
        
        await MovimientosInventario.create({
          ID_Inventario: inventario.ID_Inventario,
          Tipo_Movimiento: 'Entrada',
          Cantidad: detalle.Cantidad,
          ID_Pedido: pedido.ID_Pedido,
          Comentario: `Devolución por cancelación: ${motivo}`
        }, { transaction: t });
      }
    }
    
    await pedido.update({ Estado: 'Cancelado' }, { transaction: t });
    await t.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Pedido cancelado exitosamente y stock liberado',
      data: {
        ID_Pedido: pedido.ID_Pedido,
        Codigo_Pedido: pedido.Codigo_Pedido,
        Estado: 'Cancelado'
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al cancelar pedido:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al cancelar pedido',
      message: error.message
    });
  }
};

// Estadísticas básicas
exports.getEstadisticasPedidos = async (req, res) => {
  try {
    const estadisticasPorEstado = await Pedidos.findAll({
      attributes: [
        'Estado',
        [sequelize.fn('COUNT', sequelize.col('ID_Pedido')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('Total')), 'montoTotal']
      ],
      group: ['Estado']
    });
    
    const totalPedidos = await Pedidos.count();
    const montoTotalVentas = await Pedidos.sum('Total') || 0;
    
    return res.status(200).json({
      success: true,
      data: {
        totalPedidos,
        montoTotalVentas,
        estadisticasPorEstado
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
};