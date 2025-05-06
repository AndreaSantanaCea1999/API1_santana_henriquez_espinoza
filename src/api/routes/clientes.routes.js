const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');

// GET - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.Nombre, u.Email, u.RUT, u.Telefono, u.Direccion, u.Ciudad, u.Region, u.Estado
      FROM CLIENTE c
      JOIN USUARIO u ON c.ID_Usuario = u.ID_Usuario
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// GET - Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.Nombre, u.Email, u.RUT, u.Telefono, u.Direccion, u.Ciudad, u.Region, u.Estado
      FROM CLIENTE c
      JOIN USUARIO u ON c.ID_Usuario = u.ID_Usuario
      WHERE c.ID_Cliente = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente por ID:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// GET - Obtener pedidos de un cliente
router.get('/:id/pedidos', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT p.* FROM PEDIDOS p
      WHERE p.ID_Cliente = ?
      ORDER BY p.Fecha_Pedido DESC
    `, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pedidos del cliente:', error);
    res.status(500).json({ error: 'Error al obtener pedidos del cliente' });
  }
});

// POST - Crear nuevo cliente (con usuario asociado)
router.post('/', async (req, res) => {
  const {
    Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region,
    Tipo_Cliente, Suscrito_Newsletter, Limite_Credito
  } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Primero crear el usuario
    const [resultUsuario] = await connection.query(
      `INSERT INTO USUARIO (Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region, Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')`,
      [Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region]
    );

    const idUsuario = resultUsuario.insertId;

    // Luego crear el cliente asociado al usuario
    const [resultCliente] = await connection.query(
      `INSERT INTO CLIENTE (ID_Usuario, Tipo_Cliente, Suscrito_Newsletter, Limite_Credito)
       VALUES (?, ?, ?, ?)`,
      [idUsuario, Tipo_Cliente || 'Regular', Suscrito_Newsletter || 0, Limite_Credito || 0]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      id_cliente: resultCliente.insertId,
      id_usuario: idUsuario
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  } finally {
    if (connection) connection.release();
  }
});

// PATCH - Actualizar un cliente
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    // Datos de CLIENTE
    Tipo_Cliente, Suscrito_Newsletter, Limite_Credito,
    // Datos de USUARIO
    Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region, Estado
  } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Primero obtenemos el ID_Usuario del cliente
    const [rowsCliente] = await connection.query('SELECT ID_Usuario FROM CLIENTE WHERE ID_Cliente = ?', [id]);
    
    if (rowsCliente.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    const idUsuario = rowsCliente[0].ID_Usuario;
    
    // Actualizar datos del cliente
    if (Tipo_Cliente !== undefined || Suscrito_Newsletter !== undefined || Limite_Credito !== undefined) {
      const updateFields = [];
      const updateValues = [];
      
      if (Tipo_Cliente !== undefined) {
        updateFields.push('Tipo_Cliente = ?');
        updateValues.push(Tipo_Cliente);
      }
      if (Suscrito_Newsletter !== undefined) {
        updateFields.push('Suscrito_Newsletter = ?');
        updateValues.push(Suscrito_Newsletter);
      }
      if (Limite_Credito !== undefined) {
        updateFields.push('Limite_Credito = ?');
        updateValues.push(Limite_Credito);
      }
      
      if (updateFields.length > 0) {
        const query = `UPDATE CLIENTE SET ${updateFields.join(', ')} WHERE ID_Cliente = ?`;
        await connection.query(query, [...updateValues, id]);
      }
    }
    
    // Actualizar datos del usuario
    if (Nombre !== undefined || Email !== undefined || RUT !== undefined || 
        Telefono !== undefined || Direccion !== undefined || Ciudad !== undefined || 
        Region !== undefined || Estado !== undefined) {
      
      const updateFields = [];
      const updateValues = [];
      
      if (Nombre !== undefined) {
        updateFields.push('Nombre = ?');
        updateValues.push(Nombre);
      }
      if (Email !== undefined) {
        updateFields.push('Email = ?');
        updateValues.push(Email);
      }
      if (RUT !== undefined) {
        updateFields.push('RUT = ?');
        updateValues.push(RUT);
      }
      if (Telefono !== undefined) {
        updateFields.push('Telefono = ?');
        updateValues.push(Telefono);
      }
      if (Direccion !== undefined) {
        updateFields.push('Direccion = ?');
        updateValues.push(Direccion);
      }
      if (Ciudad !== undefined) {
        updateFields.push('Ciudad = ?');
        updateValues.push(Ciudad);
      }
      if (Region !== undefined) {
        updateFields.push('Region = ?');
        updateValues.push(Region);
      }
      if (Estado !== undefined) {
        updateFields.push('Estado = ?');
        updateValues.push(Estado);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('Ultima_Actualizacion = CURRENT_TIMESTAMP');
        const query = `UPDATE USUARIO SET ${updateFields.join(', ')} WHERE ID_Usuario = ?`;
        await connection.query(query, [...updateValues, idUsuario]);
      }
    }
    
    await connection.commit();
    
    res.json({
      message: 'Cliente actualizado exitosamente',
      id_cliente: id,
      id_usuario: idUsuario
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE - Eliminar un cliente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Primero obtenemos el ID_Usuario del cliente
    const [rowsCliente] = await connection.query('SELECT ID_Usuario FROM CLIENTE WHERE ID_Cliente = ?', [id]);
    
    if (rowsCliente.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    const idUsuario = rowsCliente[0].ID_Usuario;
    
    // Verificar si tiene pedidos asociados
    const [rowsPedidos] = await connection.query('SELECT COUNT(*) as count FROM PEDIDOS WHERE ID_Cliente = ?', [id]);
    if (rowsPedidos[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene pedidos asociados',
        pedidosAsociados: rowsPedidos[0].count
      });
    }
    
    // Eliminar el cliente
    await connection.query('DELETE FROM CLIENTE WHERE ID_Cliente = ?', [id]);
    
    // Eliminar el usuario asociado
    await connection.query('DELETE FROM USUARIO WHERE ID_Usuario = ?', [idUsuario]);
    
    await connection.commit();
    
    res.json({
      message: 'Cliente eliminado exitosamente',
      id_cliente: id,
      id_usuario: idUsuario
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;