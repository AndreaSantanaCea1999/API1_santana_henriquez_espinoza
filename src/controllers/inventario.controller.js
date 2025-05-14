const InventarioModel = require('../models/inventario.model');
const { pool } = require('../config/db');

// Obtener todo el inventario con detalles
exports.getAllInventario = async (req, res) => {
  try {
    const inventario = await InventarioModel.findAllWithDetails();
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener el inventario:', err);
    res.status(500).json({ message: 'Error al obtener el inventario' });
  }
};

// Obtener inventario por ID con detalles
exports.getInventarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const inventario = await InventarioModel.findByIdWithDetails(id);
    if (!inventario) {
      return res.status(404).json({ message: 'Inventario no encontrado' });
    }
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener inventario por ID:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener inventario por producto y sucursal
exports.getByProductoAndSucursal = async (req, res) => {
  try {
    const { idProducto, idSucursal } = req.params;
    const inventario = await InventarioModel.findInventarioByProductoAndSucursal(parseInt(idProducto), parseInt(idSucursal));
    if (!inventario) {
      return res.status(404).json({ message: 'No se encontró inventario para ese producto en esa sucursal.' });
    }
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener inventario por producto y sucursal:', err);
    res.status(500).json({ message: 'Error al obtener inventario por producto y sucursal' });
  }
};

// Obtener inventario por producto
exports.getByProducto = async (req, res) => {
  try {
    const { idProducto } = req.params;
    const inventario = await InventarioModel.findByProductoId(parseInt(idProducto));
    res.json(inventario);
  } catch (err) {
    console.error('Error al obtener inventario por producto:', err);
    res.status(500).json({ message: 'Error al obtener inventario por producto' });
  }
};

// Obtener stock por producto y sucursal (vía query params)
exports.getInventarioStockByProductoAndSucursal = async (req, res) => {
  try {
    const { productoId, sucursalId } = req.query;

    if (!productoId || !sucursalId || isNaN(productoId) || isNaN(sucursalId)) {
      return res.status(400).json({ error: 'productoId y sucursalId deben ser parámetros numéricos válidos.' });
    }

    const inventarioItem = await InventarioModel.findInventarioByProductoAndSucursal(
      parseInt(productoId),
      parseInt(sucursalId)
    );

    if (!inventarioItem) {
      return res.status(404).json({ message: 'Inventario no encontrado para ese producto y sucursal' });
    }

    res.json({
      ID_Inventario: inventarioItem.ID_Inventario,
      ID_Producto: inventarioItem.ID_Producto,
      ID_Sucursal: inventarioItem.ID_Sucursal,
      Stock_Actual: inventarioItem.Stock_Actual,
      Stock_Reservado: inventarioItem.Stock_Reservado,
    });
  } catch (err) {
    console.error('Error al obtener stock:', err);
    res.status(500).json({ message: 'Error al obtener stock' });
  }
};

// Crear nuevo inventario
exports.createInventario = async (req, res) => {
  const { ID_Producto, ID_Sucursal, Stock_Actual, ID_Bodeguero } = req.body;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (ID_Producto === undefined || ID_Sucursal === undefined) {
      await connection.rollback();
      return res.status(400).json({ error: 'ID_Producto e ID_Sucursal son obligatorios.' });
    }

    const [productoExiste, sucursalExiste, bodegueroExiste] = await Promise.all([
      InventarioModel.checkProductoExists(ID_Producto, connection),
      InventarioModel.checkSucursalExists(ID_Sucursal, connection),
      ID_Bodeguero ? InventarioModel.checkBodegueroExists(ID_Bodeguero, connection) : true,
    ]);

    if (!productoExiste || !sucursalExiste || ID_Bodeguero && !bodegueroExiste) {
      await connection.rollback();
      return res.status(400).json({ error: 'Validación fallida de producto, sucursal o bodeguero.' });
    }

    const existente = await InventarioModel.findExistingInventario(ID_Producto, ID_Sucursal, connection);
    if (existente) {
      await connection.rollback();
      return res.status(409).json({ error: 'Ya existe inventario para este producto en esta sucursal' });
    }

    const idInventario = await InventarioModel.create(req.body, connection);

    if (Stock_Actual && Stock_Actual > 0) {
      await InventarioModel.createMovimiento({
        ID_Inventario: idInventario,
        Tipo_Movimiento: 'Entrada',
        Cantidad: Stock_Actual,
        ID_Bodeguero,
        Comentario: 'Carga inicial'
      }, connection);
    }

    await connection.commit();
    res.status(201).json({ message: 'Inventario creado correctamente', ID_Inventario: idInventario });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error al crear inventario:', err);
    res.status(500).json({ message: 'Error al crear inventario' });
  } finally {
    if (connection) connection.release();
  }
};

// Actualizar campos no críticos del inventario
exports.updateInventarioFields = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    ['Stock_Actual', 'Stock_Reservado', 'ID_Producto', 'ID_Sucursal'].forEach(campo => delete updateData[campo]);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }

    const result = await InventarioModel.updateGeneralFields(id, updateData);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inventario no encontrado o sin cambios.' });
    }

    res.json({ message: 'Inventario actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar inventario:', err);
    res.status(500).json({ message: 'Error al actualizar inventario' });
  }
};

// Movimiento de stock
exports.createMovimientoInventario = async (req, res) => {
  const { id: idInventario } = req.params;
  const movimientoData = { ...req.body, ID_Inventario: parseInt(idInventario, 10) };
  const { Tipo_Movimiento, Cantidad } = movimientoData;
  let connection;

  if (!Tipo_Movimiento || Cantidad === undefined || parseFloat(Cantidad) <= 0) {
    return res.status(400).json({ error: 'Tipo de movimiento y cantidad válida son obligatorios.' });
  }

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const resultado = await InventarioModel.registrarYActualizarStock(
      parseInt(idInventario, 10),
      movimientoData,
      connection
    );

    await connection.commit();
    res.status(201).json({ message: 'Movimiento registrado', ...resultado });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error al registrar movimiento:', err);
    res.status(err.customError ? 400 : 500).json({ message: err.message || 'Error al registrar movimiento' });
  } finally {
    if (connection) connection.release();
  }
};

// Eliminar inventario y sus movimientos
exports.deleteInventario = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const count = await InventarioModel.countMovimientosByInventarioId(id, connection);
    if (count > 0) {
      await InventarioModel.removeMovimientosByInventarioId(id, connection);
    }

    const result = await InventarioModel.remove(id, connection);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Inventario no encontrado' });
    }

    await connection.commit();
    res.json({ message: 'Inventario eliminado correctamente', movimientosEliminados: count });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar inventario:', err);
    res.status(500).json({ message: 'Error al eliminar inventario' });
  } finally {
    if (connection) connection.release();
  }
};
