const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');

// GET - Obtener todas las marcas
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM MARCAS ORDER BY Nombre');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
});

// GET - Obtener una marca por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM MARCAS WHERE ID_Marca = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener marca por ID:', error);
    res.status(500).json({ error: 'Error al obtener marca' });
  }
});

// GET - Obtener productos de una marca
router.get('/:id/productos', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTOS WHERE ID_Marca = ? AND Estado = "Activo"',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos de la marca:', error);
    res.status(500).json({ error: 'Error al obtener productos de la marca' });
  }
});

// POST - Crear nueva marca
router.post('/', async (req, res) => {
  const {
    Nombre, Descripcion, Logo_URL, Pais_Origen, Sitio_Web
  } = req.body;

  if (!Nombre) {
    return res.status(400).json({ error: 'El campo Nombre es obligatorio.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO MARCAS 
       (Nombre, Descripcion, Logo_URL, Pais_Origen, Sitio_Web)
       VALUES (?, ?, ?, ?, ?)`,
      [Nombre, Descripcion, Logo_URL, Pais_Origen, Sitio_Web]
    );

    res.status(201).json({
      message: 'Marca creada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear marca:', error);
    res.status(500).json({ error: 'Error al crear marca' });
  }
});

// PATCH - Actualizar una marca
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFields = req.body;

  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  // Validar que si se envía Nombre, no esté vacío
  if (updatedFields.Nombre !== undefined && !updatedFields.Nombre) {
    return res.status(400).json({ error: 'El campo Nombre no puede estar vacío si se intenta actualizar.' });
  }

  try {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updatedFields), id];

    const query = `UPDATE MARCAS SET ${setClause} WHERE ID_Marca = ?`;
    
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    res.json({
      message: 'Marca actualizada exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    res.status(500).json({ error: 'Error al actualizar marca' });
  }
});

// DELETE - Eliminar una marca
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Verificar si hay productos que usan esta marca
    const [rowsProductos] = await connection.query(
      'SELECT COUNT(*) as count FROM PRODUCTOS WHERE ID_Marca = ?',
      [id]
    );
    
    if (rowsProductos[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'No se puede eliminar la marca porque tiene productos asociados',
        productosCount: rowsProductos[0].count
      });
    }
    
    const [result] = await connection.query('DELETE FROM MARCAS WHERE ID_Marca = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    await connection.commit();
    res.json({
      message: 'Marca eliminada exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar marca:', error);
    res.status(500).json({ error: 'Error al eliminar marca' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
