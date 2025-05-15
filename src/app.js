const express = require('express');
const apiRoutes = require('./api/index');
const sequelize = require('./config/database'); // Ajuste ruta para que sea relativa a app.js
require('dotenv').config();

const app = express();

app.use(express.json()); // body-parser integrado en Express moderno

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a la base de datos exitosa');
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });
