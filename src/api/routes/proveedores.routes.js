const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');

// GET - Obtener todos los proveedores
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM PROVEEDORES ORDER BY Nombre');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// GET - Obtener un proveedor por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM PROVEEDORES WHERE ID_Proveedor = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener proveedor por ID:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
});

// POST - Crear nuevo proveedor
router.post('/', async (req, res) => {
  const {
    Nombre, RUT, Contacto_Nombre, Contacto_Email, Contacto_Telefono,
    Direccion, Pais, Tiempo_Entrega_Promedio, Condiciones_Pago
  } = req.body;

  if (!Nombre || !RUT) {
    return res.status(400).json({ error: 'Nombre y RUT son campos obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO PROVEEDORES 
       (Nombre, RUT, Contacto_Nombre, Contacto_Email, Contacto_Telefono, Direccion, Pais, Tiempo_Entrega_Promedio, Condiciones_Pago)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Nombre, RUT, Contacto_Nombre, Contacto_Email, Contacto_Telefono, Direccion, Pais, Tiempo_Entrega_Promedio, Condiciones_Pago]
    );

    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      id: result.insertId // Asumiendo que ID_Proveedor es autoincremental o que insertId funciona para Oracle con la config correcta
    });
  } catch (error) {
    // Manejar error de RUT duplicado (asumiendo que tienes una constraint UNIQUE en RUT)
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.toLowerCase().includes('rut')) { 
      return res.status(409).json({ error: `El RUT '${RUT}' ya está registrado.` });
    }
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// PATCH - Actualizar un proveedor
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFields = req.body;

  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  // Validar que si se envía RUT, no esté vacío
  if (updatedFields.RUT !== undefined && !updatedFields.RUT) {
    return res.status(400).json({ error: 'El campo RUT no puede estar vacío si se intenta actualizar.' });
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

    const query = `UPDATE PROVEEDORES SET ${setClause} WHERE ID_Proveedor = ?`;
    
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({
      message: 'Proveedor actualizado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' && updatedFields.RUT && error.sqlMessage.toLowerCase().includes('rut')) {
      return res.status(409).json({ error: `El RUT '${updatedFields.RUT}' ya está registrado.` });
    }
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

// DELETE - Eliminar un proveedor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Verificar si hay productos asociados a este proveedor
    const [rowsProductos] = await connection.query(
      'SELECT COUNT(*) as count FROM PRODUCTOS WHERE ID_Proveedor = ?',
      [id]
    );
    
    if (rowsProductos[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'No se puede eliminar el proveedor porque tiene productos asociados',
        productosCount: rowsProductos[0].count
      });
    }
    
    const [result] = await connection.query('DELETE FROM PROVEEDORES WHERE ID_Proveedor = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    await connection.commit();
    res.json({
      message: 'Proveedor eliminado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;