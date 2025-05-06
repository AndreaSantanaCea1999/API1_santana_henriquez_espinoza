
// Configuración de la conexión a la base de datos MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();


// Crear un pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tienda',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Comprobar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos MySQL:', error);
    return false;
  }
};

module.exports = { pool, testConnection };