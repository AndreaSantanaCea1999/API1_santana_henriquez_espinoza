const { pool } = require('../../config/db');

const ClienteModel = {
  findAllWithUsuario: async () => {
    const [rows] = await pool.query(`
      SELECT c.*, u.Nombre, u.Email, u.RUT, u.Telefono, u.Direccion, u.Ciudad, u.Region, u.Estado as Usuario_Estado
      FROM CLIENTE c
      JOIN USUARIO u ON c.ID_Usuario = u.ID_Usuario
    `);
    return rows;
  },

  findByIdWithUsuario: async (idCliente) => {
    const [rows] = await pool.query(`
      SELECT c.*, u.Nombre, u.Email, u.RUT, u.Telefono, u.Direccion, u.Ciudad, u.Region, u.Estado as Usuario_Estado
      FROM CLIENTE c
      JOIN USUARIO u ON c.ID_Usuario = u.ID_Usuario
      WHERE c.ID_Cliente = ?
    `, [idCliente]);
    return rows.length > 0 ? rows[0] : null;
  },

  findPedidosByClienteId: async (idCliente) => {
    const [rows] = await pool.query(`
      SELECT p.* FROM PEDIDOS p
      WHERE p.ID_Cliente = ?
      ORDER BY p.Fecha_Pedido DESC
    `, [idCliente]);
    return rows;
  },

  createUsuario: async (usuarioData, connection) => {
    const { Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region } = usuarioData;
    const [result] = await connection.query(
      `INSERT INTO USUARIO (Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region, Estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')`,
      [Nombre, Email, RUT, Telefono, Direccion, Ciudad, Region]
    );
    return result.insertId;
  },

  createCliente: async (clienteData, idUsuario, connection) => {
    const { Tipo_Cliente, Suscrito_Newsletter, Limite_Credito } = clienteData;
    const [result] = await connection.query(
      `INSERT INTO CLIENTE (ID_Usuario, Tipo_Cliente, Suscrito_Newsletter, Limite_Credito)
       VALUES (?, ?, ?, ?)`,
      [idUsuario, Tipo_Cliente || 'Regular', Suscrito_Newsletter || 0, Limite_Credito || 0]
    );
    return result.insertId;
  },

  findUsuarioIdByClienteId: async (idCliente, connectionOrPool = pool) => {
    const [rows] = await connectionOrPool.query('SELECT ID_Usuario FROM CLIENTE WHERE ID_Cliente = ?', [idCliente]);
    return rows.length > 0 ? rows[0].ID_Usuario : null;
  },

  updateClienteData: async (idCliente, clienteFields, connection) => {
    if (Object.keys(clienteFields).length === 0) return { affectedRows: 0 };
    const setClause = Object.keys(clienteFields).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(clienteFields), idCliente];
    const [result] = await connection.query(`UPDATE CLIENTE SET ${setClause} WHERE ID_Cliente = ?`, values);
    return result;
  },

  updateUsuarioData: async (idUsuario, usuarioFields, connection) => {
    if (Object.keys(usuarioFields).length === 0) return { affectedRows: 0 };
    const setClause = Object.keys(usuarioFields).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(usuarioFields), idUsuario];
    const [result] = await connection.query(`UPDATE USUARIO SET ${setClause}, Ultima_Actualizacion = CURRENT_TIMESTAMP WHERE ID_Usuario = ?`, values);
    return result;
  },

  removeCliente: async (idCliente, connection) => {
    const [result] = await connection.query('DELETE FROM CLIENTE WHERE ID_Cliente = ?', [idCliente]);
    return result;
  },

  removeUsuario: async (idUsuario, connection) => {
    const [result] = await connection.query('DELETE FROM USUARIO WHERE ID_Usuario = ?', [idUsuario]);
    return result;
  },

  countPedidosByCliente: async (idCliente, connection) => {
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM PEDIDOS WHERE ID_Cliente = ?', [idCliente]);
    return rows[0].count;
  }
};

module.exports = ClienteModel;
