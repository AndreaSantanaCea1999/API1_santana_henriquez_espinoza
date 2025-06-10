const express = require('express');
const router = express.Router();

// Importar los modelos
const { Inventario, Productos, MovimientosInventario } = require('../models');

// ✅ Obtener todo el inventario (con detalles de productos)
router.get('/', async (req, res) => {
  try {
    const inventario = await Inventario.findAll({
      include: [{
        model: Productos,
        as: 'producto'
      }]
    });
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener inventario filtrado por sucursal
router.get('/sucursal/:sucursalId', async (req, res) => {
  try {
    const inventario = await Inventario.findAll({
      where: { ID_Sucursal: req.params.sucursalId },
      include: [{
        model: Productos,
        as: 'producto'
      }]
    });
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener inventario específico de un producto en una sucursal
router.get('/producto/:productoId/sucursal/:sucursalId', async (req, res) => {
  try {
    const { productoId, sucursalId } = req.params;

    const inventario = await Inventario.findOne({
      where: {
        ID_Producto: productoId,
        ID_Sucursal: sucursalId
      },
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

// ✅ Actualizar stock (entrada o salida) — usado desde API Banco
router.post('/actualizar-stock', async (req, res) => {
  try {
    const { ID_Producto, ID_Sucursal, cantidad, tipo } = req.body;

    const inventario = await Inventario.findOne({
      where: {
        ID_Producto,
        ID_Sucursal
      }
    });

    if (!inventario) {
      return res.status(404).json({ message: 'Inventario no encontrado' });
    }

    // Actualiza el stock
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

    res.json({
      message: 'Stock actualizado correctamente',
      inventario
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔄 Ruta para eliminar inventario por producto y sus movimientos asociados
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
    await MovimientosInventario.destroy({
      where: { ID_Inventario: idsInventario }
    });

    // Eliminar inventario
    const deletedCount = await Inventario.destroy({
      where: { ID_Producto: req.params.productoId }
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} registros de inventario eliminados para el producto ID ${req.params.productoId}`
    });
  } catch (error) {
    console.error('Error al eliminar registros de inventario por producto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar registros de inventario', error: error.message });
  }
});

module.exports = router;
