const axios = require('axios');

const API_VENTAS_URL = process.env.API_VENTAS_URL || 'http://localhost:3001/api';

// Obtener el precio en una divisa específica
const obtenerPrecioEnDivisa = async (precioOriginal, divisaOrigen = 'CLP', divisaDestino) => {
  try {
    const response = await axios.post(`${API_VENTAS_URL}/tipos-cambio/convertir`, {
      monto: precioOriginal,
      origen: divisaOrigen,
      destino: divisaDestino
    });
    
    return {
      montoConvertido: response.data.montoConvertido,
      tasaCambio: response.data.tasaCambio,
      fecha: response.data.fecha
    };
  } catch (error) {
    console.error('Error al convertir divisa:', error.message);
    throw new Error('No se pudo convertir el precio a la divisa solicitada');
  }
};

// Consultar tipos de cambio disponibles
const obtenerDivisasDisponibles = async () => {
  try {
    const response = await axios.get(`${API_VENTAS_URL}/divisas`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener divisas disponibles:', error.message);
    throw new Error('No se pudieron obtener las divisas disponibles');
  }
};

module.exports = {
  obtenerPrecioEnDivisa,
  obtenerDivisasDisponibles
};