const { pool } = require('../config/db');

const InventarioModel = {
  // Funciones que ya tenías
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

  findInventarioByProductoAndSucursal: async (idProducto, idSucursal) => {
    const [rows] = await pool.query(`
      SELECT i.*, p.Nombre AS Producto_Nombre, p.Codigo AS Producto_Codigo,
             s.Nombre AS Sucursal_Nombre
      FROM INVENTARIO i
      JOIN PRODUCTOS p ON i.ID_Producto = p.ID_Producto
      JOIN SUCURSALES s ON i.ID_Sucursal = s.ID_Sucursal
      WHERE i.ID_Producto = ? AND i.ID_Sucursal = ?
    `, [idProducto, idSucursal]);

    return rows[0] || null;
  },

  // Aquí empieza la parte nueva para validar existencia con conexión opcional (para transacciones)
  checkProductoExists: async (ID_Producto, connection) => {
    const conn = connection || pool;
    const [rows] = await conn.query('SELECT 1 FROM PRODUCTOS WHERE ID_Producto = ?', [ID_Producto]);
    return rows.length > 0;
  },

  checkSucursalExists: async (ID_Sucursal, connection) => {
    const conn = connection || pool;
    const [rows] = await conn.query('SELECT 1 FROM SUCURSALES WHERE ID_Sucursal = ?', [ID_Sucursal]);
    return rows.length > 0;
  },

  checkBodegueroExists: async (ID_Bodeguero, connection) => {
    const conn = connection || pool;
    const [rows] = await conn.query('SELECT 1 FROM BODEGUEROS WHERE ID_Bodeguero = ?', [ID_Bodeguero]);
    return rows.length > 0;
  },

  findExistingInventario: async (ID_Producto, ID_Sucursal, connection) => {
    const conn = connection || pool;
    const [rows] = await conn.query(
      `SELECT * FROM INVENTARIO WHERE ID_Producto = ? AND ID_Sucursal = ?`,
      [ID_Producto, ID_Sucursal]
    );
    return rows[0] || null;
  },

  create: async (data, connection) => {
    const {
      ID_Producto, ID_Sucursal, Stock_Actual = 0, Stock_Minimo = 0,
      Stock_Maximo, Stock_Reservado = 0, Punto_Reorden,
      Ubicacion_Almacen, ID_Bodeguero
    } = data;

    const conn = connection || pool;
    const [result] = await conn.query(`
      INSERT INTO INVENTARIO 
      (ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, Stock_Maximo, 
       Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_Producto, ID_Sucursal, Stock_Actual, Stock_Minimo, Stock_Maximo,
       Stock_Reservado, Punto_Reorden, Ubicacion_Almacen, ID_Bodeguero]
    );

    return result.insertId;
  },

  createMovimiento: async (data, connection) => {
    const {
      ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido,
      ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino
    } = data;

    const conn = connection || pool;
    const [result] = await conn.query(`
      INSERT INTO MOVIMIENTOS_INVENTARIO 
      (ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido, 
       ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_Inventario, Tipo_Movimiento, Cantidad, ID_Pedido,
       ID_Devolucion, ID_Bodeguero, Comentario, ID_Sucursal_Destino]
    );
    return result.insertId;
  },

  // Función que combina registro de movimiento y actualización de stock en la tabla inventario
  registrarYActualizarStock: async (idInventario, movimientoData, connection) => {
    const conn = connection || pool;

    // Obtener inventario actual
    const [inventarioRows] = await conn.query('SELECT * FROM INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
    if (inventarioRows.length === 0) {
      const error = new Error('Inventario no encontrado');
      error.customError = true;
      throw error;
    }
    const inventario = inventarioRows[0];

    const { Tipo_Movimiento, Cantidad } = movimientoData;

    // Calcular nuevo stock según tipo de movimiento
    let nuevoStockActual = inventario.Stock_Actual;

    if (Tipo_Movimiento.toLowerCase() === 'entrada') {
      nuevoStockActual += Cantidad;
    } else if (Tipo_Movimiento.toLowerCase() === 'salida') {
      if (inventario.Stock_Actual < Cantidad) {
        const error = new Error('Stock insuficiente para la salida');
        error.customError = true;
        throw error;
      }
      nuevoStockActual -= Cantidad;
    } else {
      const error = new Error('Tipo de movimiento inválido');
      error.customError = true;
      throw error;
    }

    // Actualizar stock
    await conn.query('UPDATE INVENTARIO SET Stock_Actual = ? WHERE ID_Inventario = ?', [nuevoStockActual, idInventario]);

    // Registrar movimiento
    const idMovimiento = await InventarioModel.createMovimiento(movimientoData, conn);

    return { ID_Movimiento: idMovimiento, Nuevo_Stock_Actual: nuevoStockActual };
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

  countMovimientosByInventarioId: async (idInventario, connection) => {
    const conn = connection || pool;
    const [rows] = await conn.query('SELECT COUNT(*) AS count FROM MOVIMIENTOS_INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
    return rows[0].count;
  },

  removeMovimientosByInventarioId: async (idInventario, connection) => {
    const conn = connection || pool;
    const [result] = await conn.query('DELETE FROM MOVIMIENTOS_INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
    return result;
  },

  remove: async (idInventario, connection) => {
    const conn = connection || pool;
    const [result] = await conn.query('DELETE FROM INVENTARIO WHERE ID_Inventario = ?', [idInventario]);
    return result;
  }
};

module.exports = InventarioModel;
