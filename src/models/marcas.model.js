const { pool } = require('../../config/db');

const MarcaModel = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM MARCAS ORDER BY Nombre');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM MARCAS WHERE ID_Marca = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  findProductosByMarcaId: async (idMarca) => {
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTOS WHERE ID_Marca = ? AND Estado = "Activo"',
      [idMarca]
    );
    return rows;
  },

  create: async (marcaData) => {
    const { Nombre, Descripcion, Logo_URL, Pais_Origen, Sitio_Web } = marcaData;
    const sql = `INSERT INTO MARCAS 
       (Nombre, Descripcion, Logo_URL, Pais_Origen, Sitio_Web)
       VALUES (?, ?, ?, ?, ?)`;
    const params = [Nombre, Descripcion, Logo_URL, Pais_Origen, Sitio_Web];
    const [result] = await pool.query(sql, params);
    return result;
  },

  update: async (id, updatedFields) => {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updatedFields), id];
    const query = `UPDATE MARCAS SET ${setClause} WHERE ID_Marca = ?`;
    const [result] = await pool.query(query, values);
    return result;
  },

  remove: async (id, connection) => { // Expects a transaction connection
    const [result] = await connection.query('DELETE FROM MARCAS WHERE ID_Marca = ?', [id]);
    return result;
  },

  // Helper for delete validation
  countProductosByMarca: async (idMarca, connection) => {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM PRODUCTOS WHERE ID_Marca = ?',
      [idMarca]
    );
    return rows[0].count;
  }
};

module.exports = MarcaModel;
