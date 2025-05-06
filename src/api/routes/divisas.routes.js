const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');

// GET - Obtener todas las divisas
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM DIVISAS ORDER BY Nombre');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener divisas:', error);
    res.status(500).json({ error: 'Error al obtener divisas' });
  }
});

// GET - Obtener una divisa por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM DIVISAS WHERE ID_Divisa = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Divisa no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener divisa por ID:', error);
    res.status(500).json({ error: 'Error al obtener divisa' });
  }
});

// POST - Crear nueva divisa
router.post('/', async (req, res) => {
  const { Codigo, Nombre, Simbolo, Es_Default } = req.body;

  if (!Codigo || !Nombre || !Simbolo) {
    return res.status(400).json({ error: 'Codigo, Nombre y Simbolo son obligatorios' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO DIVISAS (Codigo, Nombre, Simbolo, Es_Default)
       VALUES (?, ?, ?, ?)`,
      [Codigo, Nombre, Simbolo, Es_Default || 0] // Si Es_Default no se envía, se asume 0
    );

    res.status(201).json({
      message: 'Divisa creada exitosamente',
      id: result.insertId
    });
  } catch (error)
 {
    // Manejar error de entrada duplicada para el código de divisa
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: `El código de divisa '${Codigo}' ya existe.` });
    }
    console.error('Error al crear divisa:', error);
    res.status(500).json({ error: 'Error al crear divisa' });
  }
});

// PATCH - Actualizar una divisa
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFields = req.body;

  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  try {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updatedFields), id];

    const query = `UPDATE DIVISAS SET ${setClause} WHERE ID_Divisa = ?`;
    
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Divisa no encontrada' });
    }

    res.json({
      message: 'Divisa actualizada exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    // Manejar error de entrada duplicada para el código de divisa al actualizar
    if (error.code === 'ER_DUP_ENTRY' && updatedFields.Codigo) {
      return res.status(409).json({ error: `El código de divisa '${updatedFields.Codigo}' ya existe.` });
    }
    console.error('Error al actualizar divisa:', error);
    res.status(500).json({ error: 'Error al actualizar divisa' });
  }
});

// DELETE - Eliminar una divisa
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Verificar si la divisa está siendo utilizada en otras tablas
    const tablesToCheck = [
      { name: 'PRODUCTOS', column: 'ID_Divisa', friendlyName: 'productos' },
      { name: 'PEDIDOS', column: 'ID_Divisa', friendlyName: 'pedidos' },
      { name: 'HISTORIAL_PRECIOS', column: 'ID_Divisa', friendlyName: 'historial de precios' },
      { name: 'PAGOS', column: 'ID_Divisa', friendlyName: 'pagos' },
      { name: 'DOCUMENTOS_TRIBUTARIOS', column: 'ID_Divisa', friendlyName: 'documentos tributarios' },
      // Para TIPOS_CAMBIO, hay que verificar en dos columnas
    ];

    for (const tableInfo of tablesToCheck) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM ${tableInfo.name} WHERE ${tableInfo.column} = ?`,
        [id]
      );
      if (rows[0].count > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `No se puede eliminar la divisa porque está asociada a ${tableInfo.friendlyName}`,
          count: rows[0].count
        });
      }
    }
    
    // Verificar en TIPOS_CAMBIO (Origen y Destino)
    const [tiposCambioOrigenRows] = await connection.query(
        `SELECT COUNT(*) as count FROM TIPOS_CAMBIO WHERE ID_Divisa_Origen = ?`, [id]
    );
    if (tiposCambioOrigenRows[0].count > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `No se puede eliminar la divisa porque es divisa de origen en tipos de cambio`,
          count: tiposCambioOrigenRows[0].count
        });
    }
    const [tiposCambioDestinoRows] = await connection.query(
        `SELECT COUNT(*) as count FROM TIPOS_CAMBIO WHERE ID_Divisa_Destino = ?`, [id]
    );
    if (tiposCambioDestinoRows[0].count > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `No se puede eliminar la divisa porque es divisa de destino en tipos de cambio`,
          count: tiposCambioDestinoRows[0].count
        });
    }

    const [result] = await connection.query('DELETE FROM DIVISAS WHERE ID_Divisa = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Divisa no encontrada' });
    }

    await connection.commit();
    res.json({
      message: 'Divisa eliminada exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar divisa:', error);
    res.status(500).json({ error: 'Error al eliminar divisa' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
