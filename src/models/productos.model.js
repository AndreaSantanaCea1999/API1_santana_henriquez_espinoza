const { pool } = require('../../config/db');

const ProductoModel = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM PRODUCTOS');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM PRODUCTOS WHERE ID_Producto = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  create: async (productoData) => {
    const {
      Codigo, Nombre, Descripcion, Especificaciones,
      ID_Categoria, ID_Marca, ID_Proveedor, Codigo_Proveedor,
      ID_Divisa, Precio_Compra, Precio_Venta, Descuento_Maximo,
      Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado
    } = productoData;

    const sql = `INSERT INTO PRODUCTOS 
       (Codigo, Nombre, Descripcion, Especificaciones, ID_Categoria, ID_Marca, 
        ID_Proveedor, Codigo_Proveedor, ID_Divisa, Precio_Compra, Precio_Venta, 
        Descuento_Maximo, Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      Codigo, Nombre, Descripcion, Especificaciones, ID_Categoria, ID_Marca,
      ID_Proveedor || null, Codigo_Proveedor, ID_Divisa, Precio_Compra, Precio_Venta,
      Descuento_Maximo, Tasa_Impuesto, Peso, Dimensiones, Imagen_URL, Destacado, Estado
    ];
    const [result] = await pool.query(sql, params);
    return result;
  },

  update: async (id, updatedFields) => {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updatedFields), id];
    const query = `UPDATE PRODUCTOS SET ${setClause}, Ultima_Actualizacion = CURRENT_TIMESTAMP WHERE ID_Producto = ?`;
    const [result] = await pool.query(query, values);
    return result;
  },

  remove: async (id, connection) => { // Expects a transaction connection
    const [result] = await connection.query('DELETE FROM PRODUCTOS WHERE ID_Producto = ?', [id]);
    return result;
  },

  // Helper methods for foreign key validation (used by controller)
  checkCategoriaExists: async (id) => {
    const [rows] = await pool.query('SELECT ID_Categoria FROM CATEGORIAS WHERE ID_Categoria = ?', [id]);
    return rows.length > 0;
  },
  checkMarcaExists: async (id) => {
    const [rows] = await pool.query('SELECT ID_Marca FROM MARCAS WHERE ID_Marca = ?', [id]);
    return rows.length > 0;
  },
  checkProveedorExists: async (id) => {
    const [rows] = await pool.query('SELECT ID_Proveedor FROM PROVEEDORES WHERE ID_Proveedor = ?', [id]);
    return rows.length > 0;
  },
  checkDivisaExists: async (id) => {
    const [rows] = await pool.query('SELECT ID_Divisa FROM DIVISAS WHERE ID_Divisa = ?', [id]);
    return rows.length > 0;
  },

  // Helper methods for delete validation (used by controller)
  isReferencedInDetallesPedido: async (idProducto, connection) => {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM DETALLES_PEDIDO WHERE ID_Producto = ?',
      [idProducto]
    );
    return rows[0].count > 0;
  },
  isReferencedInInventario: async (idProducto, connection) => {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM INVENTARIO WHERE ID_Producto = ?',
      [idProducto]
    );
    return rows[0].count > 0;
  }
};

module.exports = ProductoModel;
