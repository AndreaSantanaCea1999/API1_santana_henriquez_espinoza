const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');

// GET - Obtener todo el inventario
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo, 
             s.Nombre as Sucursal_Nombre
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// GET - Obtener inventario por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo, 
             s.Nombre as Sucursal_Nombre
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
      WHERE i.ID_Inventario = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener inventario por ID:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// GET - Obtener inventario de una sucursal
router.get('/sucursal/:idSucursal', async (req, res) => {
  const { idSucursal } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      WHERE i.ID_Sucursal = ?
    `, [idSucursal]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener inventario de la sucursal:', error);
    res.status(500).json({ error: 'Error al obtener inventario de la sucursal' });
  }
});

// GET - Obtener inventario de un producto
router.get('/producto/:idProducto', async (req, res) => {
  const { idProducto } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT i.*, s.Nombre as Sucursal_Nombre, s.Ciudad
      FROM INVENTARIO i
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
      WHERE i.ID_Producto = ?
    `, [idProducto]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener inventario del producto:', error);
    res.status(500).json({ error: 'Error al obtener inventario del producto' });
  }
});

// POST - Crear nuevo registro de inventario
router.post('/', async (req, res) => {
  const {
    ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo,
    Stock_Maximo, Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero
  } = req.body;

  if (!ID_Producto || !ID_Sucursal) {
    return res.status(400).json({ error: 'ID_Producto e ID_Sucursal son obligatorios.' });
  }

  // Verificar si ya existe un registro para este producto y sucursal
  let connection;
  try {
    // Validaciones previas antes de iniciar la transacción
    const [productoExists] = await pool.query('SELECT ID_Producto FROM PRODUCTOS WHERE ID_Producto = ?', [ID_Producto]);
    if (productoExists.length === 0) {
      return res.status(400).json({ error: `El producto con ID ${ID_Producto} no existe.` });
    }
    const [sucursalExists] = await pool.query('SELECT ID_Sucursal FROM SUCURSALES WHERE ID_Sucursal = ?', [ID_Sucursal]);
    if (sucursalExists.length === 0) {
      return res.status(400).json({ error: `La sucursal con ID ${ID_Sucursal} no existe.` });
    }
    if (ID_Bodeguero) {
        const [bodegueroExists] = await pool.query('SELECT ID_Bodeguero FROM BODEGUERO WHERE ID_Bodeguero = ?', [ID_Bodeguero]);
        if (bodegueroExists.length === 0) { 
          return res.status(400).json({ error: `El bodeguero con ID ${ID_Bodeguero} no existe.` }); 
        }
    }

    const [existingRows] = await pool.query( // Esta verificación puede estar fuera de la transacción
      'SELECT ID_Inventario FROM INVENTARIO WHERE ID_Producto = ? AND ID_Sucursal = ?',
      [ID_Producto, ID_Sucursal]
    );
    
    if (existingRows.length > 0) {
      return res.status(409).json({ 
        // No es necesario rollback aquí si la transacción no ha comenzado o si es una verificación previa.
        // Corregido: La transacción no ha comenzado aún para esta verificación.
        error: 'Ya existe un registro de inventario para este producto en esta sucursal',
        existing_id: existingRows[0].ID_Inventario
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const [result] = await connection.query( // Usar connection
      `INSERT INTO INVENTARIO 
       (ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, Stock_Maximo, 
        Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_Producto, ID_Sucursal, Stock_Actual || 0, Stock_Minimo || 0, Stock_Maximo,
       Stock_Reservado || 0, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero]
    );

    // Registrar el movimiento de inventario inicial
    if (Stock_Actual > 0) {
      await connection.query( // Usar connection
        `INSERT INTO MOVIMIENTOS_INVENTARIO 
         (ID_Inventario, Tipo_Movimiento, Cantidad, ID_Bodeguero, Comentario)
         VALUES (?, 'Entrada', ?, ?, 'Registro inicial de inventario')`,
        [result.insertId, Stock_Actual, ID_Bodeguero]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: 'Inventario creado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al crear inventario:', error);
    res.status(500).json({ error: 'Error al crear inventario' });
  } finally {
    if (connection) connection.release();
  }
});

// PATCH - Actualizar un registro de inventario
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFields = req.body;

  // No permitir actualización directa del Stock_Actual o Stock_Reservado
  delete updatedFields.Stock_Actual;
  delete updatedFields.Stock_Reservado;

  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  try {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updatedFields), id];

    const query = `UPDATE INVENTARIO SET ${setClause}, Ultima_Actualizacion = CURRENT_TIMESTAMP WHERE ID_Inventario = ?`;
    
    const [result] = await pool.query(query, values);

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
});

// POST - Registrar movimiento de inventario
router.post('/:id/movimiento', async (req, res) => {
  const { id } = req.params;
  const {
    Tipo_Movimiento, Cantidad, ID_Pedido, ID_Devolucion,
    ID_Bodeguero, Comentario, ID_Sucursal_Destino
  } = req.body;
  
  if (!Tipo_Movimiento || !Cantidad || Cantidad <= 0) {
    return res.status(400).json({ error: 'Tipo de movimiento y cantidad son obligatorios' });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Validaciones de existencia de Bodeguero y Sucursal Destino (si aplican)
    if (ID_Bodeguero) {
      const [bodegueroExists] = await connection.query('SELECT ID_Bodeguero FROM BODEGUERO WHERE ID_Bodeguero = ?', [ID_Bodeguero]);
      if (bodegueroExists.length === 0) {
          await connection.rollback(); // Rollback antes de retornar
          connection.release();
          return res.status(400).json({ error: `El bodeguero con ID ${ID_Bodeguero} no existe.` });
      }
    }
    if (Tipo_Movimiento === 'Transferencia' && ID_Sucursal_Destino) {
      const [sucursalDestinoExists] = await connection.query('SELECT ID_Sucursal FROM SUCURSALES WHERE ID_Sucursal = ?', [ID_Sucursal_Destino]);
      if (sucursalDestinoExists.length === 0) { 
        await connection.rollback(); // Rollback antes de retornar
        connection.release();
        return res.status(400).json({ error: `La sucursal destino con ID ${ID_Sucursal_Destino} no existe.` }); 
      }
    }

    // Verificar que el inventario exista
    const [inventarioRows] = await connection.query(
      'SELECT * FROM INVENTARIO WHERE ID_Inventario = ?',
      [id]
    );
    
    if (inventarioRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }
    
    const inventario = inventarioRows[0];
    
    // Calcular el nuevo stock según el tipo de movimiento
    let nuevoStock = inventario.Stock_Actual;
    let nuevoStockReservado = inventario.Stock_Reservado;
    
    switch (Tipo_Movimiento) {
      case 'Entrada':
        nuevoStock += Cantidad;
        break;
      case 'Salida':
        if (nuevoStock - Cantidad < 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Stock insuficiente para realizar la salida' });
        }
        nuevoStock -= Cantidad;
        break;
      case 'Ajuste':
        nuevoStock = Cantidad; // El valor proporcionado es el nuevo stock total
        break;
      case 'Reserva':
        if (nuevoStock - Cantidad < 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Stock insuficiente para realizar la reserva' });
        }
        nuevoStock -= Cantidad;
        nuevoStockReservado += Cantidad;
        break;
      case 'Transferencia':
        if (!ID_Sucursal_Destino) {
          await connection.rollback();
          return res.status(400).json({ error: 'Se requiere la sucursal de destino para transferencias' });
        }
        if (nuevoStock - Cantidad < 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Stock insuficiente para realizar la transferencia' });
        }
        nuevoStock -= Cantidad;
        break;
      default:
        await connection.rollback();
        return res.status(400).json({ error: 'Tipo de movimiento no válido' });
    }
    
    // Actualizar el inventario
    await connection.query(
      `UPDATE INVENTARIO SET 
       Stock_Actual = ?, 
       Stock_Reservado = ?, 
       Ultima_Actualizacion = CURRENT_TIMESTAMP 
       WHERE ID_Inventario = ?`,
      [nuevoStock, nuevoStockReservado, id]
    );
    
    // Registrar el movimiento
    const [resultMov] = await connection.query(
      `INSERT INTO MOVIMIENTOS_INVENTARIO 
       (ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido, 
        ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, Tipo_Movimiento, Cantidad, ID_Pedido, 
       ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino]
    );
    
    // Si es una transferencia, incrementar el stock en la sucursal destino
    if (Tipo_Movimiento === 'Transferencia') {
      // Buscar si existe inventario para el mismo producto en la sucursal destino
      const [destinoRows] = await connection.query(
        `SELECT ID_Inventario FROM INVENTARIO 
         WHERE ID_Producto = ? AND ID_Sucursal = ?`,
        [inventario.ID_Producto, ID_Sucursal_Destino]
      );
      
      if (destinoRows.length > 0) {
        // Actualizar el inventario existente
        await connection.query(
          `UPDATE INVENTARIO SET 
           Stock_Actual = Stock_Actual + ?,
           Ultima_Actualizacion = CURRENT_TIMESTAMP 
           WHERE ID_Inventario = ?`,
          [Cantidad, destinoRows[0].ID_Inventario]
        );
        
        // Registrar el movimiento de entrada en el destino
        await connection.query(
          `INSERT INTO MOVIMIENTOS_INVENTARIO 
           (ID_Inventario, Tipo_Movimiento, Cantidad, ID_Bodeguero, Comentario)
           VALUES (?, 'Entrada', ?, ?, ?)`,
          [destinoRows[0].ID_Inventario, Cantidad, ID_Bodeguero, 
           `Transferencia recibida desde sucursal ${inventario.ID_Sucursal}`]
        );
      } else {
        // Crear un nuevo registro de inventario en el destino
        const [newInv] = await connection.query(
          `INSERT INTO INVENTARIO 
           (ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, 
            Stock_Reservado, ID_Bodeguero)
           VALUES (?, ?, ?, 0, 0, ?)`,
          [inventario.ID_Producto, ID_Sucursal_Destino, Cantidad, ID_Bodeguero]
        );
        
        // Registrar el movimiento de entrada en el destino
        await connection.query(
          `INSERT INTO MOVIMIENTOS_INVENTARIO 
           (ID_Inventario, Tipo_Movimiento, Cantidad, ID_Bodeguero, Comentario)
           VALUES (?, 'Entrada', ?, ?, ?)`,
          [newInv.insertId, Cantidad, ID_Bodeguero, 
           `Transferencia recibida desde sucursal ${inventario.ID_Sucursal}`]
        );
      }
    }
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Movimiento de inventario registrado exitosamente',
      id_movimiento: resultMov.insertId,
      nuevo_stock: nuevoStock,
      nuevo_stock_reservado: nuevoStockReservado
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al registrar movimiento de inventario:', error);
    res.status(500).json({ error: 'Error al registrar movimiento de inventario' });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE - Eliminar un registro de inventario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Verificar si hay movimientos registrados
    const [rowsMovimientos] = await connection.query(
      'SELECT COUNT(*) as count FROM MOVIMIENTOS_INVENTARIO WHERE ID_Inventario = ?',
      [id]
    );
    
    if (rowsMovimientos[0].count > 0) {
      // Eliminar todos los movimientos asociados
      await connection.query('DELETE FROM MOVIMIENTOS_INVENTARIO WHERE ID_Inventario = ?', [id]);
    }
    
    // Eliminar el registro de inventario
    const [result] = await connection.query('DELETE FROM INVENTARIO WHERE ID_Inventario = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }

    await connection.commit();
    res.json({
      message: 'Inventario eliminado exitosamente',
      affectedRows: result.affectedRows,
      movimientosEliminados: rowsMovimientos[0].count
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar inventario:', error);
    res.status(500).json({ error: 'Error al eliminar inventario' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;