require('dotenv').config(); // Carga las variables de .env al inicio

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Importar Rutas (Asegúrate de que las rutas a los archivos sean correctas)
const categoriasRoutes = require('./api/routes/categorias.routes');
const clientesRoutes = require('./api/routes/clientes.routes');
const divisasRoutes = require('./api/routes/divisas.routes');
const inventarioRoutes = require('./api/routes/inventario.routes');
const marcasRoutes = require('./api/routes/marcas.routes');
const pedidosRoutes = require('./api/routes/pedidos.routes');
const productosRoutes = require('./api/routes/productos.routes');
const proveedoresRoutes = require('./api/routes/proveedores.routes');
// Agrega aquí las importaciones de otras rutas que tengas (ej. usuarios, vendedores, sucursales, etc.)

// Usar Rutas
app.get('/', (req, res) => { // Ruta raíz de prueba
  res.json({ message: 'Bienvenido a la API ERP Santana-Henriquez-Espinoza' });
});

app.use('/api/categorias', categoriasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/divisas', divisasRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
// Agrega aquí el uso de otras rutas

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Middleware de manejo de errores (debe ser el último)
app.use((err, req, res, next) => {
  console.error('ERROR DETECTADO:', err.stack);
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Error interno del servidor';
  res.status(statusCode).json({ error: errorMessage });
});

app.listen(PORT, () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});