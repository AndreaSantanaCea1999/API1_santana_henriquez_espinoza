const InventarioModel = require('../models/inventario.model');
const { pool } = require('../../config/db');

const InventarioController = {
  getAllInventario: async (req, res) => {
    try {
      const inventario = await InventarioModel.findAllWithDetails();
      res.json(inventario);
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  },

  getInventarioById: async (req, res) => {
    const { id } = req.params;
    try {
      const item = await InventarioModel.findByIdWithDetails(id);
      if (!item) {
        return res.status(404).json({ error: 'Inventario no encontrado' });
      }
      res.json(item);
    } catch (error) {
      console.error('Error al obtener inventario por ID:', error);
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  },

  getInventarioBySucursal: async (req, res) => {
    const { idSucursal } = req.params;
    try {
      // Optional: Check if sucursal exists
      if (!await InventarioModel.checkSucursalExists(idSucursal)) {
        return res.status(404).json({ error: `Sucursal con ID ${idSucursal} no encontrada.` });
      }
      const inventario = await InventarioModel.findBySucursalId(idSucursal);
      res.json(inventario);
    } catch (error) {
      console.error('Error al obtener inventario de la sucursal:', error);
      res.status(500).json({ error: 'Error al obtener inventario de la sucursal' });
    }
  },

  getInventarioByProducto: async (req, res) => {
    const { idProducto } = req.params;
    try {
      // Optional: Check if producto exists
      if (!await InventarioModel.checkProductoExists(idProducto)) {
        return res.status(404).json({ error: `Producto con ID ${idProducto} no encontrado.` });
      }
      const inventario = await InventarioModel.findByProductoId(idProducto);
      res.json(inventario);
    } catch (error) {
      console.error('Error al obtener inventario del producto:', error);
      res.status(500).json({ error: 'Error al obtener inventario del producto' });
    }
  },

  createInventario: async (req, res) => {
    const inventarioData = req.body;
    const { ID_Producto, ID_Sucursal, Stock_Actual, ID_Bodeguero } = inventarioData;

    if (!ID_Producto || !ID_Sucursal) {
      return res.status(400).json({ error: 'ID_Producto e ID_Sucursal son obligatorios.' });
    }

    let connection;
    try {
      // FK Validations before transaction
      if (!await InventarioModel.checkProductoExists(ID_Producto)) {
        return res.status(400).json({ error: `El producto con ID ${ID_Producto} no existe.` });
      }
      if (!await InventarioModel.checkSucursalExists(ID_Sucursal)) {
        return res.status(400).json({ error: `La sucursal con ID ${ID_Sucursal} no existe.` });
      }
      if (ID_Bodeguero && !await InventarioModel.checkBodegueroExists(ID_Bodeguero)) {
        return res.status(400).json({ error: `El bodeguero con ID ${ID_Bodeguero} no existe.` });
      }

      const existing = await InventarioModel.findExistingInventario(ID_Producto, ID_Sucursal);
      if (existing) {
        return res.status(409).json({
          error: 'Ya existe un registro de inventario para este producto en esta sucursal',
          existing_id: existing.ID_Inventario
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const idInventario = await InventarioModel.create(inventarioData, connection);

      if (Stock_Actual && Stock_Actual > 0) {
        await InventarioModel.createMovimiento({
          ID_Inventario: idInventario,
          Tipo_Movimiento: 'Entrada',
          Cantidad: Stock_Actual,
          ID_Bodeguero: ID_Bodeguero,
          Comentario: 'Registro inicial de inventario'
        }, connection);
      }

      await connection.commit();
      res.status(201).json({
        message: 'Inventario creado exitosamente',
        id: idInventario
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al crear inventario:', error);
      res.status(500).json({ error: 'Error al crear inventario' });
    } finally {
      if (connection) connection.release();
    }
  },

  updateInventarioFields: async (req, res) => { // Renamed to avoid confusion with stock updates
    const { id } = req.params;
    const updatedFields = { ...req.body };

    delete updatedFields.Stock_Actual; // Should be handled by movimientos
    delete updatedFields.Stock_Reservado; // Should be handled by movimientos
    delete updatedFields.ID_Producto; // Generally not updatable
    delete updatedFields.ID_Sucursal; // Generally not updatable

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar (Stock_Actual, Stock_Reservado, ID_Producto, ID_Sucursal no son actualizables por esta vía).' });
    }
    
    // FK Validation if ID_Bodeguero is being updated
    if (updatedFields.ID_Bodeguero && !await InventarioModel.checkBodegueroExists(updatedFields.ID_Bodeguero)) {
        return res.status(400).json({ error: `El bodeguero con ID ${updatedFields.ID_Bodeguero} no existe.` });
    }

    try {
      const result = await InventarioModel.updateGeneralFields(id, updatedFields);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Inventario no encontrado' });
      }
      res.json({
        message: 'Inventario actualizado exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      res.status(500).json({ error: 'Error al actualizar inventario' });
    }
  },

  createMovimientoInventario: async (req, res) => {
    const { id: idInventario } = req.params; // This is ID_Inventario
    const {
      Tipo_Movimiento, Cantidad, ID_Pedido, ID_Devolucion,
      ID_Bodeguero, Comentario, ID_Sucursal_Destino
    } = req.body;

    if (!Tipo_Movimiento || !Cantidad || Cantidad <= 0) {
      return res.status(400).json({ error: 'Tipo de movimiento y cantidad (mayor a 0) son obligatorios.' });
    }
    if (Tipo_Movimiento === 'Transferencia' && !ID_Sucursal_Destino) {
        return res.status(400).json({ error: 'Se requiere la sucursal de destino para transferencias.' });
    }


    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      if (ID_Bodeguero && !await InventarioModel.checkBodegueroExists(ID_Bodeguero, connection)) {
        await connection.rollback();
        return res.status(400).json({ error: `El bodeguero con ID ${ID_Bodeguero} no existe.` });
      }
      if (Tipo_Movimiento === 'Transferencia' && ID_Sucursal_Destino) {
        if (!await InventarioModel.checkSucursalExists(ID_Sucursal_Destino, connection)) {
          await connection.rollback();
          return res.status(400).json({ error: `La sucursal destino con ID ${ID_Sucursal_Destino} no existe.` });
        }
      }

      const inventarioOrigen = await InventarioModel.findByIdRaw(idInventario, connection);
      if (!inventarioOrigen) {
        await connection.rollback();
        return res.status(404).json({ error: 'Inventario de origen no encontrado.' });
      }

      let nuevoStock = inventarioOrigen.Stock_Actual;
      let nuevoStockReservado = inventarioOrigen.Stock_Reservado;

      switch (Tipo_Movimiento) {
        case 'Entrada':
          nuevoStock += Cantidad;
          break;
        case 'Salida':
          if (nuevoStock - Cantidad < 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Stock insuficiente para realizar la salida.' });
          }
          nuevoStock -= Cantidad;
          break;
        case 'Ajuste':
          nuevoStock = Cantidad; // Cantidad es el nuevo stock total
          break;
        case 'Reserva': // Reserva disminuye stock actual y aumenta reservado
          if (nuevoStock - Cantidad < 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Stock actual insuficiente para realizar la reserva.' });
          }
          nuevoStock -= Cantidad;
          nuevoStockReservado += Cantidad;
          break;
        case 'LiberacionReserva': // Liberación aumenta stock actual y disminuye reservado
             if (nuevoStockReservado - Cantidad < 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Stock reservado insuficiente para liberar.' });
            }
            nuevoStock += Cantidad;
            nuevoStockReservado -= Cantidad;
            break;
        case 'Transferencia': // Salida de origen
          if (nuevoStock - Cantidad < 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Stock insuficiente para realizar la transferencia.' });
          }
          nuevoStock -= Cantidad;
          break;
        default:
          await connection.rollback();
          return res.status(400).json({ error: 'Tipo de movimiento no válido.' });
      }

      await InventarioModel.updateStockAfterMovimiento(idInventario, nuevoStock, nuevoStockReservado, connection);
      const idMovimiento = await InventarioModel.createMovimiento({
        ID_Inventario: idInventario, Tipo_Movimiento, Cantidad, ID_Pedido,
        ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino
      }, connection);

      if (Tipo_Movimiento === 'Transferencia') {
        let inventarioDestino = await InventarioModel.findInventarioByProductoAndSucursal(inventarioOrigen.ID_Producto, ID_Sucursal_Destino, connection);
        let idInventarioDestino;

        if (inventarioDestino) {
          idInventarioDestino = inventarioDestino.ID_Inventario;
          await InventarioModel.incrementStockInSucursal(idInventarioDestino, Cantidad, connection);
        } else {
          idInventarioDestino = await InventarioModel.createInNewSucursal({
            ID_Producto: inventarioOrigen.ID_Producto,
            ID_Sucursal: ID_Sucursal_Destino,
            Stock_Actual: Cantidad,
            ID_Bodeguero: ID_Bodeguero // Asignar bodeguero si se provee
          }, connection);
        }
        // Registrar movimiento de entrada en destino
        await InventarioModel.createMovimiento({
          ID_Inventario: idInventarioDestino,
          Tipo_Movimiento: 'Entrada', // Entrada por transferencia
          Cantidad: Cantidad,
          ID_Bodeguero: ID_Bodeguero,
          Comentario: `Transferencia recibida desde sucursal ${inventarioOrigen.ID_Sucursal} (Inv Orig: ${idInventario})`
        }, connection);
      }

      await connection.commit();
      res.status(201).json({
        message: 'Movimiento de inventario registrado exitosamente',
        id_movimiento: idMovimiento,
        id_inventario_afectado: idInventario,
        nuevo_stock_actual: nuevoStock,
        nuevo_stock_reservado: nuevoStockReservado
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al registrar movimiento de inventario:', error);
      res.status(500).json({ error: 'Error al registrar movimiento de inventario' });
    } finally {
      if (connection) connection.release();
    }
  },

  deleteInventario: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const movimientosCount = await InventarioModel.countMovimientosByInventarioId(id, connection);
      if (movimientosCount > 0) {
    
        await InventarioModel.removeMovimientosByInventarioId(id, connection);
      }

      const result = await InventarioModel.remove(id, connection);
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Inventario no encontrado' });
      }

      await connection.commit();
      res.json({
        message: 'Inventario eliminado exitosamente',
        affectedRows: result.affectedRows,
        movimientosEliminados: movimientosCount
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al eliminar inventario:', error);
      res.status(500).json({ error: 'Error al eliminar inventario' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = InventarioController;
