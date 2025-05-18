// En src/app.js (o donde tengas tus rutas)

const express = require('express');
const cors = require('cors');
const { sequelize, Inventario, Productos, MovimientosInventario } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Otras rutas...

// Ruta para eliminar registros de inventario por ID de producto
app.delete('/api/inventario/producto/:productoId', async (req, res) => {
  try {
    // Buscar todos los inventarios del producto
    const inventarios = await Inventario.findAll({
      where: { ID_Producto: req.params.productoId }
    });

    if (inventarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron registros de inventario para el producto'
      });
    }

    // Obtener IDs de inventarios para eliminar movimientos relacionados
    const idsInventario = inventarios.map(inv => inv.ID_Inventario);

    // Eliminar movimientos de inventario relacionados
    await MovimientosInventario.destroy({
      where: { ID_Inventario: idsInventario }
    });

    // Eliminar inventarios ahora que no tienen movimientos relacionados
    const deletedCount = await Inventario.destroy({
      where: { ID_Producto: req.params.productoId }
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} registros de inventario eliminados para el producto`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar registros de inventario por producto',
      error: error.message
    });
  }
});

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Inventario FERREMAS funcionando correctamente' });
});

// Iniciar servidor y conectar a la base de datos
app.listen(PORT, async () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
});

module.exports = app;
