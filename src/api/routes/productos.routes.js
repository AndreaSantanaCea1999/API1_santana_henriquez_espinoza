const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');

// GET - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM PRODUCTOS');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET - Obtener un producto por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM PRODUCTOS WHERE ID_Producto = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST - Crear nuevo producto
router.post('/', async (req, res) => {
  const {
    Codigo, Nombre, Descripcion, Especificaciones,
    ID_Categoria, ID_Marca, ID_Proveedor, Codigo_Proveedor,
    ID_Divisa, Precio_Compra, Precio_Venta, Descuento_Maximo,
    Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO PRODUCTOS 
       (Codigo, Nombre, Descripcion, Especificaciones, ID_Categoria, ID_Marca, 
        ID_Proveedor, Codigo_Proveedor, ID_Divisa, Precio_Compra, Precio_Venta, 
        Descuento_Maximo, Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Codigo, Nombre, Descripcion, Especificaciones, ID_Categoria, ID_Marca,
       ID_Proveedor, Codigo_Proveedor, ID_Divisa, Precio_Compra, Precio_Venta,
       Descuento_Maximo, Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado]
    );

    res.status(201).json({
      message: 'Producto creado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PATCH - Actualizar un producto
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFields = req.body;

  // Creamos dinámicamente la consulta SQL para actualizar solo los campos enviados
  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  try {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updatedFields), id];

    const query = `UPDATE PRODUCTOS SET ${setClause}, Ultima_Actualizacion = CURRENT_TIMESTAMP WHERE ID_Producto = ?`;
    
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto actualizado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE - Eliminar un producto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM PRODUCTOS WHERE ID_Producto = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto eliminado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;