const { pool } = require('../../config/db');

const CategoriaModel = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM CATEGORIAS ORDER BY Nivel, Orden_Visualizacion');
    return rows;
  },

  findPadres: async () => {
    const [rows] = await pool.query('SELECT * FROM CATEGORIAS WHERE ID_Categoria_Padre IS NULL ORDER BY Orden_Visualizacion');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM CATEGORIAS WHERE ID_Categoria = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  findSubcategorias: async (idCategoriaPadre) => {
    const [rows] = await pool.query(
      'SELECT * FROM CATEGORIAS WHERE ID_Categoria_Padre = ? ORDER BY Orden_Visualizacion',
      [idCategoriaPadre]
    );
    return rows;
  },

  findProductosByCategoriaId: async (idCategoria) => {
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTOS WHERE ID_Categoria = ? AND Estado = "Activo"', // Assuming "Activo" is the correct state
      [idCategoria]
    );
    return rows;
  },

  create: async (categoriaData) => {
    const { Nombre, Descripcion, ID_Categoria_Padre, Nivel, Icono_URL, Orden_Visualizacion } = categoriaData;
    const sql = `INSERT INTO CATEGORIAS 
       (Nombre, Descripcion, ID_Categoria_Padre, Nivel, Icono_URL, Orden_Visualizacion)
       VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [Nombre, Descripcion, ID_Categoria_Padre || null, Nivel, Icono_URL, Orden_Visualizacion];
    const [result] = await pool.query(sql, params);
    return result;
  },

  update: async (id, updatedFields) => {
    const setClause = Object.keys(updatedFields)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updatedFields), id];
    const query = `UPDATE CATEGORIAS SET ${setClause} WHERE ID_Categoria = ?`;
    const [result] = await pool.query(query, values);
    return result;
  },

  remove: async (id, connection) => { // Expects a transaction connection
    const [result] = await connection.query('DELETE FROM CATEGORIAS WHERE ID_Categoria = ?', [id]);
    return result;
  },

  // Helper methods for validation
  checkParentExists: async (idCategoriaPadre, connectionOrPool = pool) => {
    if (idCategoriaPadre === null || idCategoriaPadre === undefined) return true; // Null is a valid parent (root)
    const [rows] = await connectionOrPool.query('SELECT ID_Categoria FROM CATEGORIAS WHERE ID_Categoria = ?', [idCategoriaPadre]);
    return rows.length > 0;
  },

  countSubcategorias: async (idCategoria, connection) => {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM CATEGORIAS WHERE ID_Categoria_Padre = ?',
      [idCategoria]
    );
    return rows[0].count;
  },

  countProductosByCategoria: async (idCategoria, connection) => {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM PRODUCTOS WHERE ID_Categoria = ?',
      [idCategoria]
    );
    return rows[0].count;
  }
};

module.exports = CategoriaModel;
