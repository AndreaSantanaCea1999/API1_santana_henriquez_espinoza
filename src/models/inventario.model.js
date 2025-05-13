const { pool } = require('../../config/db');

const InventarioModel = {
  findAllWithDetails: async () => {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo, 
             s.Nombre as Sucursal_Nombre
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
    `);
    return rows;
  },

  findByIdWithDetails: async (idInventario) => {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo, 
             s.Nombre as Sucursal_Nombre
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
      WHERE i.ID_Inventario = ?
    `, [idInventario]);
    return rows.length > 0 ? rows[0] : null;
  },
  
  findByIdRaw: async (idInventario, connection) => { // For internal use within transactions
    const [rows] = await connection.query('SELECT * FROM INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
    return rows.length > 0 ? rows[0] : null;
  },

  findBySucursalId: async (idSucursal) => {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      WHERE i.ID_Sucursal = ?
    `, [idSucursal]);
    return rows;
  },

  findByProductoId: async (idProducto) => {
    const [rows] = await pool.query(`
      SELECT i.*, s.Nombre as Sucursal_Nombre, s.Ciudad
      FROM INVENTARIO i
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
      WHERE i.ID_Producto = ?
    `, [idProducto]);
    return rows;
  },

  findExistingInventario: async (idProducto, idSucursal, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query(
      'SELECT ID_Inventario FROM INVENTARIO WHERE ID_Producto = ? AND ID_Sucursal = ?',
      [idProducto, idSucursal]
    );
    return rows.length > 0 ? rows[0] : null;
  },
  
  findInventarioByProductoAndSucursal: async (idProducto, idSucursal, connection) => {
    const [rows] = await connection.query(
        `SELECT * FROM INVENTARIO WHERE ID_Producto = ? AND ID_Sucursal = ?`,
        [idProducto, idSucursal]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  create: async (inventarioData, connection) => {
    const {
      ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo,
      Stock_Maximo, Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero
    } = inventarioData;
    const [result] = await connection.query(
      `INSERT INTO INVENTARIO 
       (ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, Stock_Maximo, 
        Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_Producto, ID_Sucursal, Stock_Actual || 0, Stock_Minimo || 0, Stock_Maximo,
       Stock_Reservado || 0, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero]
    );
    return result.insertId;
  },
  
  createInNewSucursal: async (inventarioData, connection) => {
    const { ID_Producto, ID_Sucursal, Stock_Actual, ID_Bodeguero } = inventarioData;
     const [result] = await connection.query(
          `INSERT INTO INVENTARIO 
           (ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, 
            Stock_Reservado, ID_Bodeguero)
           VALUES (?, ?, ?, 0, 0, ?)`, // Default Stock_Minimo and Stock_Reservado to 0
          [ID_Producto, ID_Sucursal, Stock_Actual, ID_Bodeguero]
        );
    return result.insertId;
  },

  createMovimiento: async (movimientoData, connection) => {
    const {
      ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido,
      ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino
    } = movimientoData;
    const [result] = await connection.query(
      `INSERT INTO MOVIMIENTOS_INVENTARIO 
       (ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido, 
        ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido,
       ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino]
    );
    return result.insertId;
  },

  updateGeneralFields: async (idInventario, updatedFields) => { // For non-stock fields
    const setClause = Object.keys(updatedFields).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updatedFields), idInventario];
    const [result] = await pool.query(
        `UPDATE INVENTARIO SET ${setClause}, Ultima_Actualizacion = CURRENT_TIMESTAMP WHERE ID_Inventario = ?`,
        values
    );
    return result;
  },

  updateStockAfterMovimiento: async (idInventario, nuevoStock, nuevoStockReservado, connection) => {
    const [result] = await connection.query(
      `UPDATE INVENTARIO SET 
       Stock_Actual = ?, 
       Stock_Reservado = ?, 
       Ultima_Actualizacion = CURRENT_TIMESTAMP 
       WHERE ID_Inventario = ?`,
      [nuevoStock, nuevoStockReservado, idInventario]
    );
    return result;
  },
  
  incrementStockInSucursal: async (idInventario, cantidad, connection) => {
     const [result] = await connection.query(
          `UPDATE INVENTARIO SET 
           Stock_Actual = Stock_Actual + ?,
           Ultima_Actualizacion = CURRENT_TIMESTAMP 
           WHERE ID_Inventario = ?`,
          [cantidad, idInventario]
        );
    return result;
  },

  remove: async (idInventario, connection) => {
    const [result] = await connection.query('DELETE FROM INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
    return result;
  },

  removeMovimientosByInventarioId: async (idInventario, connection) => {
    await connection.query('DELETE FROM MOVIMIENTOS_INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
  },

  countMovimientosByInventarioId: async (idInventario, connection) => {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM MOVIMIENTOS_INVENTARIO WHERE ID_Inventario = ?',
      [idInventario]
    );
    return rows[0].count;
  },

  // Foreign key checks (can be shared or specific)
  checkProductoExists: async (id, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query('SELECT ID_Producto FROM PRODUCTOS WHERE ID_Producto = ?', [id]);
    return rows.length > 0;
  },
  checkSucursalExists: async (id, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query('SELECT ID_Sucursal FROM SUCURSALES WHERE ID_Sucursal = ?', [id]);
    return rows.length > 0;
  },
  checkBodegueroExists: async (id, connectionOrPool = pool) => {
    if (!id) return true; // Bodeguero can be optional
    const [rows] = await connectionOrPool.query('SELECT ID_Bodeguero FROM BODEGUERO WHERE ID_Bodeguero = ?', [id]);
    return rows.length > 0;
  }
};

module.exports = InventarioModel;
