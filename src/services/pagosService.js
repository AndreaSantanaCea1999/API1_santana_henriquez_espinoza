const axios = require('axios');

const API_VENTAS_URL = process.env.API_VENTAS_URL || 'http://localhost:3001/api';

// Iniciar transacción WebPay
const iniciarTransaccionWebPay = async (idPedido, monto, returnUrl, finalUrl) => {
  try {
    const response = await axios.post(`${API_VENTAS_URL}/webpay/iniciar`, {
      idPedido,
      monto,
      returnUrl,
      finalUrl
    });
    
    return {
      token: response.data.token,
      url: response.data.url,
      idPago: response.data.idPago
    };
  } catch (error) {
    console.error('Error al iniciar transacción WebPay:', error.message);
    throw new Error('No se pudo iniciar la transacción de pago');
  }
};

// Verificar estado de transacción WebPay
const verificarEstadoTransaccion = async (token) => {
  try {
    const response = await axios.post(`${API_VENTAS_URL}/webpay/estado-transaccion`, {
      token_ws: token
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al verificar estado de transacción:', error.message);
    throw new Error('No se pudo verificar el estado de la transacción');
  }
};

module.exports = {
  iniciarTransaccionWebPay,
  verificarEstadoTransaccion
};