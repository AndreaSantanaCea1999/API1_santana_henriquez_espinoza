const express = require('express');
const router = express.Router();

// Importar modelos
const { Inventario, Productos, MovimientosInventario } = require('../models');

console.log('🔔 inventarioRoutes cargadas');

// Crear nuevo inventario
router.post('/', async (req, res) => {
  try {
    const {
      ID_Producto,
      ID_Sucursal,
      Stock_Actual,
      Stock_Minimo,
      Stock_Maximo,
      Stock_Reservado = 0
    } = req.body;

    if (!ID_Producto || !ID_Sucursal) {
      return res.status(400).json({ message: 'ID_Producto e ID_Sucursal son obligatorios' });
    }
    if (Stock_Actual == null || Stock_Minimo == null || Stock_Maximo == null) {
      return res.status(400).json({ message: 'Stock_Actual, Stock_Minimo y Stock_Maximo son obligatorios' });
    }

    const inventarioExistente = await Inventario.findOne({ where: { ID_Producto, ID_Sucursal } });

    if (inventarioExistente) {
      return res.status(409).json({ message: 'Ya existe inventario para ese producto en esa sucursal' });
    }

    const nuevoInventario = await Inventario.create({
      ID_Producto,
      ID_Sucursal,
      Stock_Actual,
      Stock_Minimo,
      Stock_Maximo,
      Stock_Reservado
    });

    res.status(201).json({
      message: 'Inventario creado correctamente',
      inventario: nuevoInventario
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todo el inventario con detalles de productos
router.get('/', async (req, res) => {
  try {
    const inventario = await Inventario.findAll({
      include: [{ model: Productos, as: 'producto' }]
    });
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener inventario filtrado por sucursal
router.get('/sucursal/:sucursalId', async (req, res) => {
  try {
    const inventario = await Inventario.findAll({
      where: { ID_Sucursal: req.params.sucursalId },
      include: [{ model: Productos, as: 'producto' }]
    });
    // Enviar respuesta con mensaje de éxito
    res.status(200).json({
      success: true,
      message: `Inventario de la sucursal ${req.params.sucursalId} obtenido correctamente.`,
      data: inventario
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener inventario específico de un producto en una sucursal
router.get('/producto/:productoId/sucursal/:sucursalId', async (req, res) => {
  try {
    const { productoId, sucursalId } = req.params;

    const inventario = await Inventario.findOne({
      where: { ID_Producto: productoId, ID_Sucursal: sucursalId },
      include: [{
        model: Productos,
        as: 'producto',
        attributes: ['Nombre', 'Codigo', 'Precio_Venta']
      }]
    });

    if (!inventario) {
      return res.status(404).json({
        message: 'No se encontró inventario para este producto en esta sucursal',
        ID_Producto: productoId,
        ID_Sucursal: sucursalId
      });
    }

    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar stock (entrada o salida)
router.post('/actualizar-stock', async (req, res) => {
  try {
    const { ID_Producto, ID_Sucursal, cantidad, tipo } = req.body;

    if (!ID_Producto || !ID_Sucursal || !cantidad || !tipo) {
      return res.status(400).json({ message: 'Faltan parámetros obligatorios' });
    }
    if (typeof cantidad !== 'number' || cantidad <= 0) {
      return res.status(400).json({ message: 'La cantidad debe ser un número mayor que cero' });
    }

    const inventario = await Inventario.findOne({ where: { ID_Producto, ID_Sucursal } });
    if (!inventario) {
      return res.status(404).json({ message: 'Inventario no encontrado' });
    }

    if (tipo === 'salida') {
      if (inventario.Stock_Actual < cantidad) {
        return res.status(400).json({ message: 'Stock insuficiente para la salida' });
      }
      inventario.Stock_Actual -= cantidad;
    } else if (tipo === 'entrada') {
      inventario.Stock_Actual += cantidad;
    } else {
      return res.status(400).json({ message: 'Tipo inválido: debe ser "entrada" o "salida"' });
    }

    await inventario.save();

    // Convertir el tipo de movimiento a la capitalización esperada por el modelo MovimientosInventario
    let tipoMovimientoCapitalizado = '';
    if (tipo === 'entrada') {
      tipoMovimientoCapitalizado = 'Entrada';
    } else if (tipo === 'salida') {
      tipoMovimientoCapitalizado = 'Salida';
    }
    // Registrar movimiento en MovimientosInventario
    await MovimientosInventario.create({
      ID_Inventario: inventario.ID_Inventario,
      Cantidad: cantidad,
      Tipo_Movimiento: tipoMovimientoCapitalizado, // Usar el valor capitalizado
      Fecha_Movimiento: new Date()
    });

    res.json({
      message: 'Stock actualizado correctamente',
      inventario
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar inventario y movimientos asociados por producto
router.delete('/producto/:productoId', async (req, res) => {
  try {
    const inventarios = await Inventario.findAll({
      where: { ID_Producto: req.params.productoId }
    });

    if (inventarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron registros de inventario para el producto'
      });
    }

    const idsInventario = inventarios.map(inv => inv.ID_Inventario);

    // Eliminar movimientos asociados
    await MovimientosInventario.destroy({ where: { ID_Inventario: idsInventario } });

    // Eliminar inventario
    const deletedCount = await Inventario.destroy({ where: { ID_Producto: req.params.productoId } });

    res.status(200).json({
      success: true,
      message: `${deletedCount} registros de inventario eliminados para el producto ID ${req.params.productoId}`
    });
  } catch (error) {
    console.error('Error al eliminar inventario por producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar registros de inventario',
      error: error.message
    });
  }
});

module.exports = router;
