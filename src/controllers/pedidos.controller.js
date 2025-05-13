const PedidoModel = require('../models/pedido.model');
const { pool } = require('../../config/db'); // For transactions

const PedidosController = {
  getAllPedidos: async (req, res) => {
    try {
      const pedidos = await PedidoModel.findAll();
      res.json(pedidos);
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      res.status(500).json({ error: 'Error al obtener pedidos' });
    }
  },

  getPedidoById: async (req, res) => {
    const { id } = req.params;
    try {
      const pedido = await PedidoModel.findById(id);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      res.json(pedido);
    } catch (error) {
      console.error('Error al obtener pedido por ID:', error);
      res.status(500).json({ error: 'Error al obtener pedido' });
    }
  },

  getPedidoDetalles: async (req, res) => {
    const { id } = req.params;
    try {
      const detalles = await PedidoModel.findDetailsByOrderId(id);
      // The original code returned 404 if no details, but an empty array is also a valid response.
      // Let's stick to original behavior for now.
      if (detalles.length === 0) {
        // Check if pedido itself exists to differentiate
        const pedido = await PedidoModel.findById(id);
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        return res.status(404).json({ error: 'No se encontraron detalles para este pedido' });
      }
      res.json(detalles);
    } catch (error) {
      console.error('Error al obtener detalles del pedido:', error);
      res.status(500).json({ error: 'Error al obtener detalles del pedido' });
    }
  },

  createPedido: async (req, res) => {
    const {
      Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal,
      Canal, Estado, Metodo_Entrega, Total, ID_Divisa, detalles,
      // other fields from req.body
      ...pedidoFields 
    } = req.body;

    // Basic validations
    if (!Codigo_Pedido || !ID_Cliente || !ID_Sucursal || Total === undefined || !ID_Divisa || !Canal || !Estado || !Metodo_Entrega) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el pedido.' });
    }
    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos un detalle.' });
    }
    
    const estadosPedidoValidos = ['Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto'];
    if (!estadosPedidoValidos.includes(Estado)) {
        return res.status(400).json({ error: `Estado de pedido '${Estado}' no válido.` });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // FK Validations
      if (!await PedidoModel.checkClienteExists(ID_Cliente, connection)) {
        await connection.rollback();
        return res.status(400).json({ error: `El cliente con ID ${ID_Cliente} no existe.` });
      }
      if (ID_Vendedor && !await PedidoModel.checkVendedorExists(ID_Vendedor, connection)) {
        await connection.rollback();
        return res.status(400).json({ error: `El vendedor con ID ${ID_Vendedor} no existe.` });
      }
      if (!await PedidoModel.checkSucursalExists(ID_Sucursal, connection)) {
        await connection.rollback();
        return res.status(400).json({ error: `La sucursal con ID ${ID_Sucursal} no existe.` });
      }
      if (!await PedidoModel.checkDivisaExists(ID_Divisa, connection)) {
        await connection.rollback();
        return res.status(400).json({ error: `La divisa con ID ${ID_Divisa} no existe.` });
      }

      for (const detalle of detalles) {
        if (!detalle.ID_Producto || detalle.Cantidad === undefined || detalle.Precio_Unitario === undefined || detalle.Subtotal === undefined) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cada detalle debe tener ID_Producto, Cantidad, Precio_Unitario y Subtotal.' });
        }
        if (!await PedidoModel.checkProductoExists(detalle.ID_Producto, connection)) {
            await connection.rollback();
            return res.status(400).json({ error: `El producto con ID ${detalle.ID_Producto} en los detalles no existe.` });
        }
      }
      
      const pedidoDataForModel = {
          Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal, Canal, Estado, Metodo_Entrega, Total, ID_Divisa, ...pedidoFields
      };

      const idPedido = await PedidoModel.create(pedidoDataForModel, detalles, connection);
      
      const idUsuarioParaHistorico = await PedidoModel.getUsuarioIdForHistorico(ID_Vendedor, ID_Cliente, connection);
      if (!idUsuarioParaHistorico) {
          await connection.rollback();
          // This case should ideally not happen if cliente/vendedor validation passed and they have associated users.
          // Or, the system allows creating orders without an immediate user context for historico (e.g. system user).
          // For now, let's assume it's an error if no user is found.
          console.error('Failed to determine user for historico: Vendedor/Cliente might not have an associated Usuario ID or logic error.');
          return res.status(500).json({ error: 'No se pudo determinar el ID de usuario para el histórico del pedido.' });
      }

      await PedidoModel.addEstadoHistorico(idPedido, null, Estado, idUsuarioParaHistorico, 'Creación inicial del pedido', connection);

      await connection.commit();
      res.status(201).json({
        message: 'Pedido creado exitosamente',
        id: idPedido
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al crear pedido:', error);
      // Add specific error checks like ER_DUP_ENTRY for Codigo_Pedido if it's unique
      res.status(500).json({ error: 'Error al crear pedido' });
    } finally {
      if (connection) connection.release();
    }
  },

  updatePedidoEstado: async (req, res) => {
    const { id } = req.params;
    const { Estado, ID_Usuario, Comentario } = req.body;

    if (!Estado || ID_Usuario === undefined) { // ID_Usuario can be 0, so check for undefined
      return res.status(400).json({ error: 'Se requiere Estado e ID_Usuario' });
    }

    const estadosPedidoValidos = ['Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto'];
    if (!estadosPedidoValidos.includes(Estado)) {
      return res.status(400).json({ error: `Estado de pedido '${Estado}' no válido.` });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const pedidoActual = await PedidoModel.findById(id); // Use connection if findById supports it for transactional read
      if (!pedidoActual) {
        await connection.rollback();
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      const estadoAnterior = pedidoActual.Estado;

      if (estadoAnterior === Estado) {
        await connection.rollback(); // No change, no need to proceed
        return res.status(200).json({ message: 'El estado del pedido ya es el solicitado.', estadoActual: Estado });
      }

      await PedidoModel.updateEstadoInDB(id, Estado, connection);
      await PedidoModel.addEstadoHistorico(id, estadoAnterior, Estado, ID_Usuario, Comentario || `Cambio de estado de ${estadoAnterior} a ${Estado}`, connection);

      await connection.commit();
      res.json({
        message: 'Estado del pedido actualizado exitosamente',
        idPedido: id,
        estadoAnterior,
        estadoNuevo: Estado
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al actualizar estado del pedido:', error);
      res.status(500).json({ error: 'Error al actualizar estado del pedido' });
    } finally {
      if (connection) connection.release();
    }
  },

  updatePedido: async (req, res) => {
    const { id } = req.params;
    const updatedFields = { ...req.body };

    // 'detalles' and 'Estado' should be handled by their specific endpoints
    delete updatedFields.detalles; 
    delete updatedFields.Estado;

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar (o solo campos no permitidos para esta ruta).' });
    }
    // Add FK validations if updatable fields like ID_Cliente, ID_Vendedor etc. are present

    try {
      const result = await PedidoModel.update(id, updatedFields);
      if (result.affectedRows === 0 && (!result.message || !result.message.includes("No fields to update"))) {
        return res.status(404).json({ error: 'Pedido no encontrado o ningún campo válido para actualizar.' });
      }
       if (result.message && result.message.includes("No fields to update")) {
        return res.status(200).json({ message: result.message, affectedRows: 0 });
      }

      res.json({
        message: 'Pedido actualizado exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      res.status(500).json({ error: 'Error al actualizar pedido' });
    }
  },

  deletePedido: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const result = await PedidoModel.remove(id, connection);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      await connection.commit();
      res.json({
        message: 'Pedido eliminado exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al eliminar pedido:', error);
      res.status(500).json({ error: 'Error al eliminar pedido' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = PedidosController;
