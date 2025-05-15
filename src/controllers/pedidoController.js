const Pedido = require('../models/pedido');

exports.getAll = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll();
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      message: '❌ Error al obtener pedidos',
      error: error.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      Codigo_Pedido,
      ID_Cliente,
      ID_Sucursal,
      Fecha_Pedido,
      Canal,
      Estado,
      Metodo_Entrega,
      Pais_Entrega,
      Subtotal,
      Descuento,
      Impuestos,
      Costo_Envio,
      Total,
      ID_Divisa,
      Prioridad
    } = req.body;

    // Validar campos mínimos obligatorios
    if (!Codigo_Pedido || !ID_Cliente || !ID_Sucursal || !Subtotal || !Total || !ID_Divisa) {
      return res.status(400).json({ message: 'Faltan campos obligatorios para crear el pedido' });
    }

    const pedido = await Pedido.create({
      Codigo_Pedido,
      ID_Cliente,
      ID_Sucursal,
      Fecha_Pedido: Fecha_Pedido || new Date(),
      Canal: Canal || 'Online',
      Estado: Estado || 'Pendiente',
      Metodo_Entrega: Metodo_Entrega || 'Despacho_Domicilio',
      Pais_Entrega: Pais_Entrega || 'Chile',
      Subtotal,
      Descuento: Descuento || 0,
      Impuestos: Impuestos || 0,
      Costo_Envio: Costo_Envio || 0,
      Total,
      ID_Divisa,
      Prioridad: Prioridad || 'Normal'
    });

    res.status(201).json({
      message: '✅ Pedido creado correctamente',
      pedido
    });
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({
      message: '❌ Error creando pedido',
      error: error.message
    });
  }
};
