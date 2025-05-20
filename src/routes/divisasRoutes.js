const express = require('express');
const router = express.Router();
const divisasService = require('../services/divisasService');

// Obtener todas las divisas disponibles
router.get('/', async (req, res) => {
  try {
    const divisas = await divisasService.obtenerDivisasDisponibles();
    res.status(200).json(divisas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convertir un monto entre divisas
router.post('/convertir', async (req, res) => {
  try {
    const { monto, origen, destino } = req.body;
    
    if (!monto || !origen || !destino) {
      return res.status(400).json({ message: 'Se requieren monto, divisa origen y divisa destino' });
    }
    
    const resultado = await divisasService.obtenerPrecioEnDivisa(monto, origen, destino);
    
    res.status(200).json({
      montoOriginal: parseFloat(monto),
      divisaOrigen: origen,
      montoConvertido: resultado.montoConvertido,
      divisaDestino: destino,
      tasaCambio: resultado.tasaCambio,
      fecha: resultado.fecha
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;