const express = require('express');
const apiRoutes = require('../api/index');
const sequelize = require('../config/database');
require('dotenv').config();

const app = express();

app.use(express.json());

// Importar rutas que no estén incluidas en apiRoutes (si es que hay)
const pedidosRoutes = require('../routes/pedidos');

// Usar rutas principales
app.use('/api', apiRoutes);

// Usar ruta pedidos (si no está ya en apiRoutes)
app.use('/api/pedidos', pedidosRoutes);

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a la base de datos exitosa');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });
