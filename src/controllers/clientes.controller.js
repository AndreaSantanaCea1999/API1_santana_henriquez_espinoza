const ClienteModel = require('../models/cliente.model');
const { pool } = require('../../config/db');

const ClientesController = {
  getAllClientes: async (req, res) => {
    try {
      const clientes = await ClienteModel.findAllWithUsuario();
      res.json(clientes);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  },

  getClienteById: async (req, res) => {
    const { id } = req.params;
    try {
      const cliente = await ClienteModel.findByIdWithUsuario(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json(cliente);
    } catch (error) {
      console.error('Error al obtener cliente por ID:', error);
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  },

  getPedidosByCliente: async (req, res) => {
    const { id } = req.params;
    try {
      // Optional: Check if client exists first
      const cliente = await ClienteModel.findByIdWithUsuario(id);
      if (!cliente) {
          return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      const pedidos = await ClienteModel.findPedidosByClienteId(id);
      res.json(pedidos);
    } catch (error) {
      console.error('Error al obtener pedidos del cliente:', error);
      res.status(500).json({ error: 'Error al obtener pedidos del cliente' });
    }
  },

  createClienteWithUsuario: async (req, res) => {
    const {
      Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region, // Usuario data
      Tipo_Cliente, Suscrito_Newsletter, Limite_Credito // Cliente data
    } = req.body;

    if (!Nombre || !Email) {
      return res.status(400).json({ error: 'Nombre y Email son obligatorios para crear el usuario asociado al cliente.' });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const usuarioData = { Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region };
      const idUsuario = await ClienteModel.createUsuario(usuarioData, connection);

      const clienteData = { Tipo_Cliente, Suscrito_Newsletter, Limite_Credito };
      const idCliente = await ClienteModel.createCliente(clienteData, idUsuario, connection);

      await connection.commit();
      res.status(201).json({
        message: 'Cliente creado exitosamente',
        id_cliente: idCliente,
        id_usuario: idUsuario
      });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.toLowerCase().includes('email')) {
          return res.status(409).json({ error: `El email '${Email}' ya está registrado.` });
        } else if (RUT && error.sqlMessage.toLowerCase().includes('rut')) { // Check if RUT was provided
          return res.status(409).json({ error: `El RUT '${RUT}' ya está registrado.` });
        }
      }
      console.error('Error al crear cliente:', error);
      res.status(500).json({ error: 'Error al crear cliente' });
    } finally {
      if (connection) connection.release();
    }
  },

  updateClienteAndUsuario: async (req, res) => {
    const { id: idCliente } = req.params;
    const {
      Tipo_Cliente, Suscrito_Newsletter, Limite_Credito, // Cliente fields
      Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region, Estado // Usuario fields
    } = req.body;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const idUsuario = await ClienteModel.findUsuarioIdByClienteId(idCliente, connection);
      if (!idUsuario) {
        await connection.rollback();
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const clienteFieldsToUpdate = {};
      if (Tipo_Cliente !== undefined) clienteFieldsToUpdate.Tipo_Cliente = Tipo_Cliente;
      if (Suscrito_Newsletter !== undefined) clienteFieldsToUpdate.Suscrito_Newsletter = Suscrito_Newsletter;
      if (Limite_Credito !== undefined) clienteFieldsToUpdate.Limite_Credito = Limite_Credito;

      if (Object.keys(clienteFieldsToUpdate).length > 0) {
        await ClienteModel.updateClienteData(idCliente, clienteFieldsToUpdate, connection);
      }

      const usuarioFieldsToUpdate = {};
      if (Nombre !== undefined) usuarioFieldsToUpdate.Nombre = Nombre;
      if (Email !== undefined) usuarioFieldsToUpdate.Email = Email;
      if (RUT !== undefined) usuarioFieldsToUpdate.RUT = RUT;
      if (Telefono !== undefined) usuarioFieldsToUpdate.Telefono = Telefono;
      if (Direccion !== undefined) usuarioFieldsToUpdate.Direccion = Direccion;
      if (Ciudad !== undefined) usuarioFieldsToUpdate.Ciudad = Ciudad;
      if (Region !== undefined) usuarioFieldsToUpdate.Region = Region;
      if (Estado !== undefined) usuarioFieldsToUpdate.Estado = Estado;
      
      if (Object.keys(usuarioFieldsToUpdate).length > 0) {
        await ClienteModel.updateUsuarioData(idUsuario, usuarioFieldsToUpdate, connection);
      }

      await connection.commit();
      res.json({
        message: 'Cliente actualizado exitosamente',
        id_cliente: idCliente,
        id_usuario: idUsuario
      });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        if (Email && error.sqlMessage.toLowerCase().includes('email')) {
          return res.status(409).json({ error: `El email '${Email}' ya está registrado.` });
        } else if (RUT && error.sqlMessage.toLowerCase().includes('rut')) {
          return res.status(409).json({ error: `El RUT '${RUT}' ya está registrado.` });
        }
      }
      console.error('Error al actualizar cliente:', error);
      res.status(500).json({ error: 'Error al actualizar cliente' });
    } finally {
      if (connection) connection.release();
    }
  },

  deleteClienteAndUsuario: async (req, res) => {
    const { id: idCliente } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const idUsuario = await ClienteModel.findUsuarioIdByClienteId(idCliente, connection);
      if (!idUsuario) {
        await connection.rollback();
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const pedidosCount = await ClienteModel.countPedidosByCliente(idCliente, connection);
      if (pedidosCount > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No se puede eliminar el cliente porque tiene pedidos asociados',
          pedidosAsociados: pedidosCount
        });
      }

      await ClienteModel.removeCliente(idCliente, connection);
      await ClienteModel.removeUsuario(idUsuario, connection);

      await connection.commit();
      res.json({
        message: 'Cliente eliminado exitosamente',
        id_cliente: idCliente,
        id_usuario: idUsuario
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al eliminar cliente:', error);
      res.status(500).json({ error: 'Error al eliminar cliente' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = ClientesController;
