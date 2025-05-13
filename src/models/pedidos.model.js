const { pool } = require('../../config/db');

const PedidoModel = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM PEDIDOS');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM PEDIDOS WHERE ID_Pedido = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  findDetailsByOrderId: async (id) => {
    const [rows] = await pool.query(
      `SELECT dp.*, p.Nombre as Producto_Nombre, p.Codigo as Producto_Codigo 
       FROM DETALLES_PEDIDO dp
       LEFT JOIN PRODUCTOS p ON dp.ID_Producto = p.ID_Producto
       WHERE dp.ID_Pedido = ?`,
      [id]
    );
    return rows; // Returns array, could be empty
  },

  create: async (pedidoData, detalles, connection) => {
    const {
      Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal,
      Canal, Estado, Metodo_Entrega, Direccion_Entrega,
      Ciudad_Entrega, Region_Entrega, Pais_Entrega, Comentarios,
      Subtotal, Descuento, Impuestos, Costo_Envio, Total, ID_Divisa,
      Fecha_Estimada_Entrega, Prioridad
    } = pedidoData;

    const [resultPedido] = await connection.query(
      `INSERT INTO PEDIDOS 
       (Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal,
        Canal, Estado, Metodo_Entrega, Direccion_Entrega,
        Ciudad_Entrega, Region_Entrega, Pais_Entrega, Comentarios,
        Subtotal, Descuento, Impuestos, Costo_Envio, Total, ID_Divisa,
        Fecha_Estimada_Entrega, Prioridad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal,
       Canal, Estado, Metodo_Entrega, Direccion_Entrega,
       Ciudad_Entrega, Region_Entrega, Pais_Entrega, Comentarios,
       Subtotal, Descuento, Impuestos, Costo_Envio, Total, ID_Divisa,
       Fecha_Estimada_Entrega, Prioridad]
    );
    const idPedido = resultPedido.insertId;

    for (const detalle of detalles) {
      await connection.query(
        `INSERT INTO DETALLES_PEDIDO 
         (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario, 
          Descuento, Impuesto, Subtotal, Estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [idPedido, detalle.ID_Producto, detalle.Cantidad,
         detalle.Precio_Unitario, detalle.Descuento, detalle.Impuesto,
         detalle.Subtotal, detalle.Estado || 'Pendiente']
      );
    }
    return idPedido;
  },

  addEstadoHistorico: async (idPedido, estadoAnterior, estadoNuevo, idUsuario, comentario, connection) => {
    await connection.query(
      `INSERT INTO HISTORICO_ESTADOS_PEDIDO 
       (ID_Pedido, Estado_Anterior, Estado_Nuevo, ID_Usuario, Comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [idPedido, estadoAnterior, estadoNuevo, idUsuario, comentario]
    );
  },

  getUsuarioIdForHistorico: async (ID_Vendedor, ID_Cliente, connection) => {
    let idUsuarioParaHistorico;
    if (ID_Vendedor) {
      const [vendedorInfo] = await connection.query('SELECT ID_Usuario FROM VENDEDOR WHERE ID_Vendedor = ?', [ID_Vendedor]);
      if (vendedorInfo.length > 0) idUsuarioParaHistorico = vendedorInfo[0].ID_Usuario;
    }
    if (!idUsuarioParaHistorico && ID_Cliente) { // Check ID_Cliente only if ID_Vendedor didn't yield a user
      const [clienteInfo] = await connection.query('SELECT ID_Usuario FROM CLIENTE WHERE ID_Cliente = ?', [ID_Cliente]);
      if (clienteInfo.length > 0) idUsuarioParaHistorico = clienteInfo[0].ID_Usuario;
    }
    return idUsuarioParaHistorico;
  },

  updateEstadoInDB: async (id, estado, connection) => {
    const [result] = await connection.query(
      'UPDATE PEDIDOS SET Estado = ? WHERE ID_Pedido = ?',
      [estado, id]
    );
    return result;
  },

  update: async (id, updatedFields) => {
    // Ensure 'Estado' is not updated through this generic method if it has special handling
    delete updatedFields.Estado; 
    if (Object.keys(updatedFields).length === 0) {
        return { affectedRows: 0, message: "No fields to update or only 'Estado' was provided." };
    }

    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updatedFields), id];
    const query = `UPDATE PEDIDOS SET ${setClause} WHERE ID_Pedido = ?`;
    const [result] = await pool.query(query, values);
    return result;
  },

  remove: async (id, connection) => {
    await connection.query('DELETE FROM DETALLES_PEDIDO WHERE ID_Pedido = ?', [id]);
    await connection.query('DELETE FROM HISTORICO_ESTADOS_PEDIDO WHERE ID_Pedido = ?', [id]);
    const [result] = await connection.query('DELETE FROM PEDIDOS WHERE ID_Pedido = ?', [id]);
    return result;
  },

  // Foreign key validation helpers (can be used by controller)
  checkClienteExists: async (id, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query('SELECT ID_Cliente FROM CLIENTE WHERE ID_Cliente = ?', [id]);
    return rows.length > 0;
  },
  checkVendedorExists: async (id, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query('SELECT ID_Vendedor FROM VENDEDOR WHERE ID_Vendedor = ?', [id]);
    return rows.length > 0;
  },
  checkSucursalExists: async (id, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query('SELECT ID_Sucursal FROM SUCURSALES WHERE ID_Sucursal = ?', [id]);
    return rows.length > 0;
  },
  checkDivisaExists: async (id, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query('SELECT ID_Divisa FROM DIVISAS WHERE ID_Divisa = ?', [id]);
    return rows.length > 0;
  },
  checkProductoExists: async (id, connectionOrPool = pool) => { // Re-using from producto.model logic, ideally import
    const [rows] = await connectionOrPool.query('SELECT ID_Producto FROM PRODUCTOS WHERE ID_Producto = ?', [id]);
    return rows.length > 0;
  }
};

module.exports = PedidoModel;
