const { sequelize, MovimientosInventario, Inventario, Productos } = require('../models'); // Importar sequelize

// Obtener todos los movimientos
exports.getAllMovimientos = async (req, res) => {
  try {
    const movimientos = await MovimientosInventario.findAll({
      include: [
        { 
          model: Inventario, 
          as: 'inventario',
          include: [{ model: Productos, as: 'producto' }]
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener movimientos',
      message: error.message
    });
  }
};

// Obtener movimiento por ID
exports.getMovimientoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movimiento = await MovimientosInventario.findByPk(id, {
      include: [
        { 
          model: Inventario, 
          as: 'inventario',
          include: [{ model: Productos, as: 'producto' }]
        }
      ]
    });
    
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    console.error('Error al obtener movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener movimiento',
      message: error.message
    });
  }
};

// Obtener movimientos por inventario
exports.getMovimientosByInventario = async (req, res) => {
  try {
    const { inventarioId } = req.params;
    
    const movimientos = await MovimientosInventario.findAll({
      where: { ID_Inventario: inventarioId },
      include: [
        { 
          model: Inventario, 
          as: 'inventario',
          include: [{ model: Productos, as: 'producto' }]
        }
      ],
      order: [['Fecha', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    console.error('Error al obtener movimientos por inventario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener movimientos por inventario',
      message: error.message
    });
  }
};

// Crear un nuevo movimiento
exports.createMovimiento = async (req, res) => {
  const t = await sequelize.transaction(); // Iniciar transacción
  try {
    const {
      ID_Inventario,
      Tipo_Movimiento,
      Cantidad,
      ID_Pedido,
      ID_Devolucion,
      ID_Bodeguero,
      Comentario,
      ID_Sucursal_Destino
    } = req.body;

    const inventario = await Inventario.findByPk(ID_Inventario, { transaction: t });
    if (!inventario) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'El inventario especificado no existe'
      });
    }

    if (!['Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia'].includes(Tipo_Movimiento)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Tipo de movimiento no válido'
      });
    }

    if (Tipo_Movimiento === 'Salida' && inventario.Stock_Actual < Cantidad) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Stock insuficiente para este movimiento'
      });
    }

    if (Tipo_Movimiento === 'Transferencia' && !ID_Sucursal_Destino) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Se requiere sucursal destino para transferencias'
      });
    }

    const nuevoMovimiento = await MovimientosInventario.create({
      ID_Inventario,
      Tipo_Movimiento,
      Cantidad,
      Fecha: new Date(),
      ID_Pedido,
      ID_Devolucion,
      ID_Bodeguero,
      Comentario,
      ID_Sucursal_Destino
    }, { transaction: t });

    switch(Tipo_Movimiento) {
      case 'Entrada':
        await inventario.update({
          Stock_Actual: inventario.Stock_Actual + parseInt(Cantidad),
          Ultima_Actualizacion: new Date()
        }, { transaction: t });
        break;
      case 'Salida':
        await inventario.update({
          Stock_Actual: inventario.Stock_Actual - parseInt(Cantidad),
          Ultima_Actualizacion: new Date()
        }, { transaction: t });
        break;
      case 'Reserva':
        await inventario.update({
          Stock_Actual: inventario.Stock_Actual - parseInt(Cantidad),
          Stock_Reservado: inventario.Stock_Reservado + parseInt(Cantidad),
          Ultima_Actualizacion: new Date()
        }, { transaction: t });
        break;
      case 'Ajuste':
        await inventario.update({
          Stock_Actual: parseInt(Cantidad),
          Ultima_Actualizacion: new Date()
        }, { transaction: t });
        break;
      case 'Transferencia':
        await inventario.update({
          Stock_Actual: inventario.Stock_Actual - parseInt(Cantidad),
          Ultima_Actualizacion: new Date()
        }, { transaction: t });
        
        const inventarioDestino = await Inventario.findOne({
          where: {
            ID_Producto: inventario.ID_Producto,
            ID_Sucursal: ID_Sucursal_Destino
          },
          transaction: t
        });
        
        if (inventarioDestino) {
          await inventarioDestino.update({
            Stock_Actual: inventarioDestino.Stock_Actual + parseInt(Cantidad),
            Ultima_Actualizacion: new Date()
          }, { transaction: t });
        }
        break;
    }

    await t.commit(); // Confirmar la transacción si todo fue bien

    const movimientoCompleto = await MovimientosInventario.findByPk(nuevoMovimiento.ID_Movimiento, {
      include: [
        { 
          model: Inventario, 
          as: 'inventario',
          include: [{ model: Productos, as: 'producto' }]
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Movimiento creado exitosamente',
      data: movimientoCompleto
    });
  } catch (error) {
    await t.rollback(); // Revertir la transacción en caso de error
    console.error('Error al crear movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear movimiento',
      message: error.message
    });
  }
};

// Actualizar un movimiento
exports.updateMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const movimiento = await MovimientosInventario.findByPk(id);
    
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }
    
    // No permitir cambios en campos críticos
    delete updateData.ID_Inventario;
    delete updateData.Tipo_Movimiento;
    delete updateData.Cantidad;
    delete updateData.Fecha;
    
    // Solo permitir actualizar comentarios y otros campos no críticos
    await movimiento.update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Movimiento actualizado exitosamente',
      data: movimiento
    });
  } catch (error) {
    console.error('Error al actualizar movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar movimiento',
      message: error.message
    });
  }
};

// Eliminar un movimiento
exports.deleteMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movimiento = await MovimientosInventario.findByPk(id, {
      include: [{ model: Inventario, as: 'inventario' }]
    });
    
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }
    
    // Revertir el efecto del movimiento en el inventario
    const inventario = movimiento.inventario;
    
    if (inventario) {
      switch(movimiento.Tipo_Movimiento) {
        case 'Entrada':
          await inventario.update({
            Stock_Actual: inventario.Stock_Actual - movimiento.Cantidad,
            Ultima_Actualizacion: new Date()
          });
          break;
        case 'Salida':
          await inventario.update({
            Stock_Actual: inventario.Stock_Actual + movimiento.Cantidad,
            Ultima_Actualizacion: new Date()
          });
          break;
        case 'Reserva':
          await inventario.update({
            Stock_Actual: inventario.Stock_Actual + movimiento.Cantidad,
            Stock_Reservado: inventario.Stock_Reservado - movimiento.Cantidad,
            Ultima_Actualizacion: new Date()
          });
          break;
        case 'Transferencia':
          // Aumentar el stock en origen
          await inventario.update({
            Stock_Actual: inventario.Stock_Actual + movimiento.Cantidad,
            Ultima_Actualizacion: new Date()
          });
          
          // Si existe un inventario en el destino, disminuir el stock
          if (movimiento.ID_Sucursal_Destino) {
            const inventarioDestino = await Inventario.findOne({
              where: {
                ID_Producto: inventario.ID_Producto,
                ID_Sucursal: movimiento.ID_Sucursal_Destino
              }
            });
            
            if (inventarioDestino) {
              await inventarioDestino.update({
                Stock_Actual: Math.max(0, inventarioDestino.Stock_Actual - movimiento.Cantidad),
                Ultima_Actualizacion: new Date()
              });
            }
          }
          break;
        // Para ajustes no se realiza reversión automática
      }
    }
    
    await movimiento.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Movimiento eliminado exitosamente y stock ajustado'
    });
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar movimiento',
      message: error.message
    });
  }
};

// Obtener movimientos por fecha
exports.getMovimientosByFecha = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren fechas de inicio y fin'
      });
    }
    
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);
    
    // Validar formato de fechas
    if (isNaN(fechaInicioObj.getTime()) || isNaN(fechaFinObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }
    
    // Ajustar fechaFin al final del día
    fechaFinObj.setHours(23, 59, 59, 999);
    
    const movimientos = await MovimientosInventario.findAll({
      where: {
        Fecha: {
          [Op.between]: [fechaInicioObj, fechaFinObj]
        }
      },
      include: [
        { 
          model: Inventario, 
          as: 'inventario',
          include: [{ model: Productos, as: 'producto' }]
        }
      ],
      order: [['Fecha', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    console.error('Error al obtener movimientos por fecha:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener movimientos por fecha',
      message: error.message
    });
  }
};

// Obtener movimientos por tipo
exports.getMovimientosByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    if (!['Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de movimiento no válido'
      });
    }
    
    const movimientos = await MovimientosInventario.findAll({
      where: { Tipo_Movimiento: tipo },
      include: [
        { 
          model: Inventario, 
          as: 'inventario',
          include: [{ model: Productos, as: 'producto' }]
        }
      ],
      order: [['Fecha', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      count: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    console.error('Error al obtener movimientos por tipo:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener movimientos por tipo',
      message: error.message
    });
  }
};

// Generar reporte de movimientos
exports.generarReporteMovimientos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipoMovimiento, sucursalId } = req.query;
    
    let whereClause = {};
    
    // Filtrar por fecha
    if (fechaInicio && fechaFin) {
      const fechaInicioObj = new Date(fechaInicio);
      const fechaFinObj = new Date(fechaFin);
      fechaFinObj.setHours(23, 59, 59, 999);
      
      whereClause.Fecha = {
        [Op.between]: [fechaInicioObj, fechaFinObj]
      };
    }
    
    // Filtrar por tipo de movimiento
    if (tipoMovimiento && ['Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia'].includes(tipoMovimiento)) {
      whereClause.Tipo_Movimiento = tipoMovimiento;
    }
    
    // Construir include con filtros adicionales
    let includeInventario = {
      model: Inventario,
      as: 'inventario',
      include: [{ model: Productos, as: 'producto' }]
    };
    
    // Filtrar por sucursal
    if (sucursalId) {
      includeInventario.where = {
        ID_Sucursal: sucursalId
      };
    }
    
    const movimientos = await MovimientosInventario.findAll({
      where: whereClause,
      include: [includeInventario],
      order: [['Fecha', 'DESC']]
    });
    
    // Generar resumen
    const resumen = {
      totalMovimientos: movimientos.length,
      movimientosPorTipo: {},
      totalCantidadMovida: 0
    };
    
    // Contabilizar por tipo
    movimientos.forEach(movimiento => {
      if (!resumen.movimientosPorTipo[movimiento.Tipo_Movimiento]) {
        resumen.movimientosPorTipo[movimiento.Tipo_Movimiento] = 0;
      }
      resumen.movimientosPorTipo[movimiento.Tipo_Movimiento]++;
      resumen.totalCantidadMovida += parseInt(movimiento.Cantidad);
    });
    
    return res.status(200).json({
      success: true,
      resumen,
      data: movimientos
    });
  } catch (error) {
    console.error('Error al generar reporte de movimientos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar reporte de movimientos',
      message: error.message
    });
  }
};