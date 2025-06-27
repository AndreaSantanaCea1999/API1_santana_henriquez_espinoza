// src/routes/externalApiRoutes.js
const express = require('express');
const router = express.Router();
const externalApiController = require('../controllers/externalApiController');

// Middleware para validar API Key (para tiendas externas)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key requerida',
      message: 'Debe proporcionar una API Key válida en el header x-api-key'
    });
  }
  
  // TODO: Validar API Key contra base de datos
  // Por ahora permitimos cualquier key para testing
  if (apiKey === 'test-key') {
    req.clienteExterno = { nombre: 'Cliente Test' };
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'API Key inválida'
    });
  }
};

// Rutas públicas para tiendas externas
router.get('/producto/:codigo', validateApiKey, externalApiController.getProductoFormatoExterno);
router.get('/catalogo', validateApiKey, externalApiController.getCatalogoExterno);

// Información sobre divisas disponibles
router.get('/divisas', validateApiKey, async (req, res) => {
  try {
    const divisasDisponibles = [
      { codigo: 'CLP', nombre: 'Peso Chileno', simbolo: '$' },
      { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: 'US$' },
      { codigo: 'EUR', nombre: 'Euro', simbolo: '€' }
    ];
    
    res.json({
      success: true,
      divisas: divisasDisponibles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Información sobre categorías disponibles
router.get('/categorias', validateApiKey, async (req, res) => {
  try {
    const { Categorias } = require('../models');
    
    const categorias = await Categorias.findAll({
      where: { Nivel: 1 }, // Solo categorías principales
      attributes: ['ID_Categoria', 'Nombre', 'Descripcion'],
      order: [['Orden_Visualizacion', 'ASC']]
    });
    
    res.json({
      success: true,
      categorias
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Información sobre marcas disponibles
router.get('/marcas', validateApiKey, async (req, res) => {
  try {
    const { Marcas } = require('../models');
    
    const marcas = await Marcas.findAll({
      attributes: ['ID_Marca', 'Nombre', 'Pais_Origen']
    });
    
    res.json({
      success: true,
      marcas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;