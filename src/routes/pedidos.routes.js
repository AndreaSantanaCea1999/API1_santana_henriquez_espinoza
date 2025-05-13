const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');


// GET - Obtener todos los pedidos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM PEDIDOS');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// GET - Obtener un pedido por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM PEDIDOS WHERE ID_Pedido = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener pedido por ID:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

// GET - Obtener detalles de un pedido
router.get('/:id/detalles', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT dp.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo 
       FROM DETALLES_PEDIDO dp
       LEFT JOIN PRODUCTOS p ON dp.ID_Producto = p.ID_Producto
       WHERE dp.ID_Pedido = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron detalles para este pedido' });
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).json({ error: 'Error al obtener detalles del pedido' });
  }
});

// POST - Crear nuevo pedido
router.post('/', async (req, res) => {
  const {
    Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal,
    Canal, Estado, Metodo_Entrega, Direccion_Entrega,
    Ciudad_Entrega, Region_Entrega, Pais_Entrega, Comentarios,
    Subtotal, Descuento, Impuestos, Costo_Envio, Total, ID_Divisa,
    Fecha_Estimada_Entrega, Prioridad, detalles
  } = req.body;

  // Validaciones básicas
  if (!Codigo_Pedido || !ID_Cliente || !ID_Sucursal || !Total || !ID_Divisa || !Canal || !Estado || !Metodo_Entrega) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para el pedido.' });
  }
  if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: 'El pedido debe contener al menos un detalle.' });
  }

  // Iniciar transacción
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validar existencia de IDs foráneos
    const [clienteExists] = await connection.query('SELECT ID_Cliente FROM CLIENTE WHERE ID_Cliente = ?', [ID_Cliente]);
    if (clienteExists.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: `El cliente con ID ${ID_Cliente} no existe.` });
    }
    if (ID_Vendedor) {
      const [vendedorExists] = await connection.query('SELECT ID_Vendedor FROM VENDEDOR WHERE ID_Vendedor = ?', [ID_Vendedor]);
      if (vendedorExists.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: `El vendedor con ID ${ID_Vendedor} no existe.` });
      }
    }
    const [sucursalExists] = await connection.query('SELECT ID_Sucursal FROM SUCURSALES WHERE ID_Sucursal = ?', [ID_Sucursal]);
    if (sucursalExists.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: `La sucursal con ID ${ID_Sucursal} no existe.` });
    }
    const [divisaExists] = await connection.query('SELECT ID_Divisa FROM DIVISAS WHERE ID_Divisa = ?', [ID_Divisa]);
    if (divisaExists.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: `La divisa con ID ${ID_Divisa} no existe.` });
    }

    // Validar estado del pedido
    const estadosPedidoValidos = ['Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto'];
    if (!estadosPedidoValidos.includes(Estado)) {
        await connection.rollback();
        return res.status(400).json({ error: `Estado de pedido '${Estado}' no válido.` });
    }

    // Insertar el pedido
    const [resultPedido] = await connection.query(
      `INSERT INTO PEDIDOS 
       (Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal,
        Canal, Estado, Metodo_Entrega, Direccion_Entrega,
        Ciudad_Entrega, Region_Entrega, Pais_Entrega, Comentarios,
        Subtotal, Descuento, Impuestos, Costo_Envio, Total, ID_Divisa,
        Fecha_Estimada_Entrega, Prioridad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal,
       Canal, Estado, Metodo_Entrega, Direccion_Entrega,
       Ciudad_Entrega, Region_Entrega, Pais_Entrega, Comentarios,
       Subtotal, Descuento, Impuestos, Costo_Envio, Total, ID_Divisa,
       Fecha_Estimada_Entrega, Prioridad]
    );

    const idPedido = resultPedido.insertId;

    // Si hay detalles, insertarlos
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      for (const detalle of detalles) {
        if (!detalle.ID_Producto || !detalle.Cantidad || detalle.Precio_Unitario === undefined || detalle.Subtotal === undefined) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cada detalle debe tener ID_Producto, Cantidad, Precio_Unitario y Subtotal.' });
        }
        const [productoExists] = await connection.query('SELECT ID_Producto FROM PRODUCTOS WHERE ID_Producto = ?', [detalle.ID_Producto]);
        if (productoExists.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: `El producto con ID ${detalle.ID_Producto} en los detalles no existe.` });
        }
        await connection.query(
          `INSERT INTO DETALLES_PEDIDO 
           (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario, 
            Descuento, Impuesto, Subtotal, Estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [idPedido, detalle.ID_Producto, detalle.Cantidad, 
           detalle.Precio_Unitario, detalle.Descuento, detalle.Impuesto, 
           detalle.Subtotal, detalle.Estado || 'Pendiente']
        );
      }
    }
    

    let idUsuarioParaHistorico;
    if (ID_Vendedor) {
      // Se asume que la validación previa de vendedorExists fue exitosa si ID_Vendedor fue provisto.
      const [vendedorInfo] = await connection.query('SELECT ID_Usuario FROM VENDEDOR WHERE ID_Vendedor = ?', [ID_Vendedor]);
      idUsuarioParaHistorico = vendedorInfo[0].ID_Usuario;
    } else {
      // Se asume que la validación previa de clienteExists fue exitosa.
      const [clienteInfo] = await connection.query('SELECT ID_Usuario FROM CLIENTE WHERE ID_Cliente = ?', [ID_Cliente]);
      idUsuarioParaHistorico = clienteInfo[0].ID_Usuario;
    }

    if (!idUsuarioParaHistorico) {
        await connection.rollback();
        return res.status(500).json({ error: 'No se pudo determinar el ID de usuario para el histórico del pedido.' });
    }
    await connection.query(
      `INSERT INTO HISTORICO_ESTADOS_PEDIDO 
       (ID_Pedido, Estado_Anterior, Estado_Nuevo, ID_Usuario, Comentario)
       VALUES (?, NULL, ?, ?, 'Creación inicial del pedido')`,
      [idPedido, Estado, idUsuarioParaHistorico]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      id: idPedido
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  } finally {
    if (connection) connection.release();
  }
});

// PATCH - Actualizar el estado de un pedido
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { Estado, ID_Usuario, Comentario } = req.body;
  
  if (!Estado || !ID_Usuario) {
    return res.status(400).json({ error: 'Se requiere Estado e ID_Usuario' });
  }

  const estadosPedidoValidos = ['Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto'];
  if (!estadosPedidoValidos.includes(Estado)) {
      // No necesitamos rollback aquí ya que no hemos iniciado transacción para esta validación previa.
      return res.status(400).json({ error: `Estado de pedido '${Estado}' no válido.` });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Obtener estado actual
    const [rowsPedido] = await connection.query(
      'SELECT Estado FROM PEDIDOS WHERE ID_Pedido = ?',
      [id]
    );

    if (rowsPedido.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = rowsPedido[0].Estado;
    
    // Actualizar el estado del pedido
    await connection.query(
      'UPDATE PEDIDOS SET Estado = ? WHERE ID_Pedido = ?',
      [Estado, id]
    );
    
    // Registrar en histórico de estados
    await connection.query(
      `INSERT INTO HISTORICO_ESTADOS_PEDIDO 
       (ID_Pedido, Estado_Anterior, Estado_Nuevo, ID_Usuario, Comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [id, estadoAnterior, Estado, ID_Usuario, Comentario || `Cambio de estado de ${estadoAnterior} a ${Estado}`]
    );
    
    await connection.commit();

    res.json({
      message: 'Estado del pedido actualizado exitosamente',
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
});

// PATCH - Actualizar un pedido
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFields = { ...req.body };
  
  // Eliminar campos que no deberían actualizarse directamente
  delete updatedFields.detalles;
  
  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  try {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updatedFields), id];

    const query = `UPDATE PEDIDOS SET ${setClause} WHERE ID_Pedido = ?`;
    
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      message: 'Pedido actualizado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

// DELETE - Eliminar un pedido
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Eliminar registros relacionados en otras tablas
    await connection.query('DELETE FROM DETALLES_PEDIDO WHERE ID_Pedido = ?', [id]);
    await connection.query('DELETE FROM HISTORICO_ESTADOS_PEDIDO WHERE ID_Pedido = ?', [id]);
    
    // Finalmente eliminar el pedido
    const [result] = await connection.query('DELETE FROM PEDIDOS WHERE ID_Pedido = ?', [id]);

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
});

module.exports = router;