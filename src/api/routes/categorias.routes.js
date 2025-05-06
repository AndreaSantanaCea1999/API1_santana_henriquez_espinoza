const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');

// GET - Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM CATEGORIAS ORDER BY Nivel, Orden_Visualizacion');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET - Obtener categorías padre (nivel superior)
router.get('/padres', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM CATEGORIAS WHERE ID_Categoria_Padre IS NULL ORDER BY Orden_Visualizacion');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener categorías padre:', error);
    res.status(500).json({ error: 'Error al obtener categorías padre' });
  }
});

// GET - Obtener una categoría por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM CATEGORIAS WHERE ID_Categoria = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener categoría por ID:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

// GET - Obtener subcategorías de una categoría
router.get('/:id/subcategorias', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM CATEGORIAS WHERE ID_Categoria_Padre = ? ORDER BY Orden_Visualizacion',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
});

// GET - Obtener productos de una categoría
router.get('/:id/productos', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTOS WHERE ID_Categoria = ? AND Estado = "Activo"',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos de la categoría:', error);
    res.status(500).json({ error: 'Error al obtener productos de la categoría' });
  }
});

// POST - Crear nueva categoría
router.post('/', async (req, res) => {
  const {
    Nombre, Descripcion, ID_Categoria_Padre, 
    Nivel, Icono_URL, Orden_Visualizacion
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO CATEGORIAS 
       (Nombre, Descripcion, ID_Categoria_Padre, Nivel, Icono_URL, Orden_Visualizacion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Nombre, Descripcion, ID_Categoria_Padre, Nivel, Icono_URL, Orden_Visualizacion]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// PATCH - Actualizar una categoría
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

    const query = `UPDATE CATEGORIAS SET ${setClause} WHERE ID_Categoria = ?`;
    
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({
      message: 'Categoría actualizada exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// DELETE - Eliminar una categoría
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Verificar si hay subcategorías
    const [rowsSubcategorias] = await connection.query(
      'SELECT COUNT(*) as count FROM CATEGORIAS WHERE ID_Categoria_Padre = ?',
      [id]
    );
    
    if (rowsSubcategorias[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'No se puede eliminar la categoría porque tiene subcategorías',
        subcategoriasCount: rowsSubcategorias[0].count
      });
    }
    
    // Verificar si hay productos
    const [rowsProductos] = await connection.query(
      'SELECT COUNT(*) as count FROM PRODUCTOS WHERE ID_Categoria = ?',
      [id]
    );
    
    if (rowsProductos[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'No se puede eliminar la categoría porque tiene productos asociados',
        productosCount: rowsProductos[0].count
      });
    }
    
    const [result] = await connection.query('DELETE FROM CATEGORIAS WHERE ID_Categoria = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    await connection.commit();
    res.json({
      message: 'Categoría eliminada exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
