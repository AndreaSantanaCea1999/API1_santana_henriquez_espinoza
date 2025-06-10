// src/verify-db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarConexion() {
  console.log('🔍 Verificando conexión a base de datos...\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'administrador',
    password: process.env.DB_PASSWORD || 'yR!9uL2@pX', 
    database: process.env.DB_NAME || 'ferremas_complete'
  };

  // Mostrar configuración (oculta contraseña)
  console.log('📋 Configuración:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   API Puerto: ${process.env.PORT || 3000}\n`);

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa!\n');

    // Obtener todas las tablas
    console.log('📊 Verificando tablas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   Total de tablas: ${tables.length}`);

    // Tablas que deben existir
    const tablasRequeridas = [
      'usuario', 'cliente', 'productos', 'inventario', 'sucursales',
      'pedidos', 'detalles_pedido', 'divisas', 'tipos_cambio',
      'pagos', 'webpay_transacciones'
    ];

    const tablasEncontradas = tables.map(t => Object.values(t)[0]);
    let todasLasTablasCriticasExisten = true;

    console.log('\n📋 Tablas críticas:');
    for (const tabla of tablasRequeridas) {
      const existe = tablasEncontradas.includes(tabla);
      console.log(`   ${existe ? '✅' : '❌'} ${tabla}`);
      if (!existe) todasLasTablasCriticasExisten = false;
    }

    // Verificar datos básicos
    console.log('\n📈 Verificando datos:');
    const queriesConteo = [
      { tabla: 'sucursales', descripcion: 'Sucursales' },
      { tabla: 'usuario', descripcion: 'Usuarios' },
      { tabla: 'cliente', descripcion: 'Clientes' },
      { tabla: 'productos', descripcion: 'Productos' },
      { tabla: 'inventario', descripcion: 'Registros de inventario' },
      { tabla: 'divisas', descripcion: 'Divisas' }
    ];

    for (const q of queriesConteo) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as total FROM ${q.tabla}`);
        console.log(`   ${q.descripcion}: ${result[0].total}`);
      } catch (err) {
        console.log(`   ${q.descripcion}: ❌ Error - ${err.message}`);
      }
    }

    // Verificar productos con inventario en sucursal 1 (solo si las tablas existen)
    if (
      todasLasTablasCriticasExisten &&
      tablasEncontradas.includes('productos') &&
      tablasEncontradas.includes('inventario')
    ) {
      console.log('\n🏪 Productos con inventario en sucursal 1 (ejemplo):');
      const [productosConInventario] = await connection.execute(`
        SELECT p.ID_Producto, p.Codigo, p.Nombre, i.Stock_Actual
        FROM productos p
        LEFT JOIN inventario i ON p.ID_Producto = i.ID_Producto AND i.ID_Sucursal = 1
        WHERE p.Estado = 'Activo'
        LIMIT 5
      `);

      productosConInventario.forEach(p => {
        console.log(`   ID: ${p.ID_Producto} | ${p.Codigo} | ${p.Nombre} | Stock: ${p.Stock_Actual !== null ? p.Stock_Actual : 'N/A'}`);
      });
    } else if (!todasLasTablasCriticasExisten) {
      console.log('\n⚠️  No se pudo ejecutar la consulta de ejemplo de productos con inventario porque faltan tablas críticas.');
    }

    await connection.end();
    console.log(`\n${todasLasTablasCriticasExisten ? '✅' : '⚠️'} Verificación completada${!todasLasTablasCriticasExisten ? ' con advertencias sobre tablas faltantes.' : '!'}`);

  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.error('\nPosibles soluciones:');
    console.error('1. Verifica que MySQL esté corriendo');
    console.error('2. Verifica las credenciales en el archivo .env');
    console.error('3. Asegúrate de que la base de datos "ferremas_complete" exista');
    console.error('4. Verifica que el usuario tiene permisos sobre la base de datos');
  }
}

verificarConexion();
