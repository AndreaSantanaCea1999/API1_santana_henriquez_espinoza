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

  // Validaciones básicas de campos obligatorios (puedes expandir esto)
  if (!Codigo || !Nombre || !ID_Categoria || !ID_Marca || !ID_Divisa || Precio_Venta === undefined) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: Codigo, Nombre, ID_Categoria, ID_Marca, ID_Divisa, Precio_Venta son requeridos.' });
  }

  const estadosValidos = ['Activo', 'Inactivo', 'Descontinuado'];
  if (Estado && !estadosValidos.includes(Estado)) {
    return res.status(400).json({ error: `El estado '${Estado}' no es válido. Valores permitidos: ${estadosValidos.join(', ')}.` });
  }


  try {
    // Verificar existencia de IDs foráneos
    const [categoriaExists] = await pool.query('SELECT ID_Categoria FROM CATEGORIAS WHERE ID_Categoria = ?', [ID_Categoria]);
    if (categoriaExists.length === 0) {
      return res.status(400).json({ error: `La categoría con ID ${ID_Categoria} no existe.` });
    }

    const [marcaExists] = await pool.query('SELECT ID_Marca FROM MARCAS WHERE ID_Marca = ?', [ID_Marca]);
    if (marcaExists.length === 0) {
      return res.status(400).json({ error: `La marca con ID ${ID_Marca} no existe.` });
    }

    if (ID_Proveedor) { // ID_Proveedor puede ser opcional (NULL)
      const [proveedorExists] = await pool.query('SELECT ID_Proveedor FROM PROVEEDORES WHERE ID_Proveedor = ?', [ID_Proveedor]);
      if (proveedorExists.length === 0) {
        return res.status(400).json({ error: `El proveedor con ID ${ID_Proveedor} no existe.` });
      }
    }

    const [divisaExists] = await pool.query('SELECT ID_Divisa FROM DIVISAS WHERE ID_Divisa = ?', [ID_Divisa]);
    if (divisaExists.length === 0) {
      return res.status(400).json({ error: `La divisa con ID ${ID_Divisa} no existe.` });
    }


    // Si todas las validaciones pasan, proceder con la inserción
    const [result] = await pool.query(
      `INSERT INTO PRODUCTOS 
       (Codigo, Nombre, Descripcion, Especificaciones, ID_Categoria, ID_Marca, 
        ID_Proveedor, Codigo_Proveedor, ID_Divisa, Precio_Compra, Precio_Venta, 
        Descuento_Maximo, Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Codigo, Nombre, Descripcion, Especificaciones, ID_Categoria, ID_Marca,
       ID_Proveedor || null, Codigo_Proveedor, ID_Divisa, Precio_Compra, Precio_Venta,
       Descuento_Maximo, Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado]
    );

    res.status(201).json({
      message: 'Producto creado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('-----------------------------------------');
    console.error('DETALLE DEL ERROR AL CREAR PRODUCTO:');
    console.error('Error Code:', error.code);
    console.error('Error No:', error.errno);
    console.error('SQL Message:', error.sqlMessage);
    console.error('SQL State:', error.sqlState);
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('-----------------------------------------');
    // Manejar error de entrada duplicada para el código de producto si tienes una constraint UNIQUE
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('productos.Codigo')) { // Ajusta 'productos.Codigo' si tu constraint tiene otro nombre
      return res.status(409).json({ error: `El código de producto '${Codigo}' ya existe.` });
    }
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

  const estadosValidos = ['Activo', 'Inactivo', 'Descontinuado'];
  if (updatedFields.Estado && !estadosValidos.includes(updatedFields.Estado)) {
    return res.status(400).json({ error: `El estado '${updatedFields.Estado}' no es válido. Valores permitidos: ${estadosValidos.join(', ')}.` });
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
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar si el producto está en detalles de pedido
    const [detallesPedidoRows] = await connection.query(
      'SELECT COUNT(*) as count FROM DETALLES_PEDIDO WHERE ID_Producto = ?',
      [id]
    );
    if (detallesPedidoRows[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No se puede eliminar el producto porque está asociado a pedidos.' });
    }

    // Verificar si el producto está en inventario
    const [inventarioRows] = await connection.query(
      'SELECT COUNT(*) as count FROM INVENTARIO WHERE ID_Producto = ?',
      [id]
    );
    if (inventarioRows[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No se puede eliminar el producto porque tiene registros de inventario.' });
    }
    
    // Aquí podrías añadir más verificaciones (ej. PRODUCTOS_PROMOCION, HISTORIAL_PRECIOS)

    const [result] = await connection.query('DELETE FROM PRODUCTOS WHERE ID_Producto = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await connection.commit();
    res.json({
      message: 'Producto eliminado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;