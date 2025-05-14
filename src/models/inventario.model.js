const { pool } = require('../config/db');

const InventarioModel = {
  findAllWithDetails: async () => {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre AS Producto_Nombre, p.Codigo AS Producto_Codigo, 
             s.Nombre AS Sucursal_Nombre
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
    `);
    return rows;
  },

  findByIdWithDetails: async (idInventario) => {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre AS Producto_Nombre, p.Codigo AS Producto_Codigo, 
             s.Nombre AS Sucursal_Nombre
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
      WHERE i.ID_Inventario = ?
    `, [idInventario]);
    return rows[0] || null;
  },

  findBySucursalId: async (idSucursal) => {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre AS Producto_Nombre, p.Codigo AS Producto_Codigo
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      WHERE i.ID_Sucursal = ?
    `, [idSucursal]);
    return rows;
  },

  findByProductoId: async (idProducto) => {
    const [rows] = await pool.query(`
      SELECT i.*, s.Nombre AS Sucursal_Nombre, s.Ciudad
      FROM INVENTARIO i
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
      WHERE i.ID_Producto = ?
    `, [idProducto]);
    return rows;
  },

  findExistingInventario: async (idProducto, idSucursal) => {
    const [rows] = await pool.query(
      'SELECT ID_Inventario FROM INVENTARIO WHERE ID_Producto = ? AND ID_Sucursal = ?',
      [idProducto, idSucursal]
    );
    return rows[0] || null;
  },

  create: async (data) => {
    const {
      ID_Producto, ID_Sucursal, Stock_Actual = 0, Stock_Minimo = 0,
      Stock_Maximo, Stock_Reservado = 0, Punto_Reorden,
      Ubicacion_Almacen, ID_Bodeguero
    } = data;

    const [result] = await pool.query(`
      INSERT INTO INVENTARIO 
      (ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, Stock_Maximo, 
       Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, Stock_Maximo,
       Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero]
    );

    return result.insertId;
  },

  updateGeneralFields: async (idInventario, updatedFields) => {
    const keys = Object.keys(updatedFields);
    const values = Object.values(updatedFields);

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    values.push(idInventario);

    const [result] = await pool.query(
      `UPDATE INVENTARIO SET ${setClause}, Ultima_Actualizacion = CURRENT_TIMESTAMP WHERE ID_Inventario = ?`,
      values
    );
    return result;
  },

  createMovimiento: async (data) => {
    const {
      ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido,
      ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino
    } = data;

    const [result] = await pool.query(`
      INSERT INTO MOVIMIENTOS_INVENTARIO 
      (ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido, 
       ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido,
       ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino]
    );
    return result.insertId;
  },

  delete: async (idInventario) => {
    const [result] = await pool.query('DELETE FROM INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
    return result;
  }
};

module.exports = InventarioModel;
