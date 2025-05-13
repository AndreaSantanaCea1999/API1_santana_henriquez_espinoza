const ProductoModel = require('../models/producto.model');
const { pool } = require('../../config/db'); // For transactions

const ProductosController = {
  getAllProductos: async (req, res) => {
    try {
      const productos = await ProductoModel.findAll();
      res.json(productos);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  },

  getProductoById: async (req, res) => {
    const { id } = req.params;
    try {
      const producto = await ProductoModel.findById(id);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json(producto);
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      res.status(500).json({ error: 'Error al obtener producto' });
    }
  },

  createProducto: async (req, res) => {
    const productoData = req.body;
    const {
      Codigo, Nombre, ID_Categoria, ID_Marca, ID_Divisa, Precio_Venta, Estado, ID_Proveedor
    } = productoData;

    // Validaciones básicas
    if (!Codigo || !Nombre || !ID_Categoria || !ID_Marca || !ID_Divisa || Precio_Venta === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: Codigo, Nombre, ID_Categoria, ID_Marca, ID_Divisa, Precio_Venta son requeridos.' });
    }

    const estadosValidos = ['Activo', 'Inactivo', 'Descontinuado'];
    if (Estado && !estadosValidos.includes(Estado)) {
      return res.status(400).json({ error: `El estado '${Estado}' no es válido. Valores permitidos: ${estadosValidos.join(', ')}.` });
    }

    try {
      // Verificar existencia de IDs foráneos
      if (!await ProductoModel.checkCategoriaExists(ID_Categoria)) {
        return res.status(400).json({ error: `La categoría con ID ${ID_Categoria} no existe.` });
      }
      if (!await ProductoModel.checkMarcaExists(ID_Marca)) {
        return res.status(400).json({ error: `La marca con ID ${ID_Marca} no existe.` });
      }
      if (ID_Proveedor && !await ProductoModel.checkProveedorExists(ID_Proveedor)) {
        return res.status(400).json({ error: `El proveedor con ID ${ID_Proveedor} no existe.` });
      }
      if (!await ProductoModel.checkDivisaExists(ID_Divisa)) {
        return res.status(400).json({ error: `La divisa con ID ${ID_Divisa} no existe.` });
      }

      const result = await ProductoModel.create(productoData);
      res.status(201).json({
        message: 'Producto creado exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('-----------------------------------------');
      console.error('DETALLE DEL ERROR AL CREAR PRODUCTO:');
      console.error('Error Code:', error.code);
      console.error('Error No:', error.errno);
      console.error('SQL Message:', error.sqlMessage);
      console.error('SQL State:', error.sqlState);
      console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('-----------------------------------------');
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('productos.Codigo')) {
        return res.status(409).json({ error: `El código de producto '${Codigo}' ya existe.` });
      }
      res.status(500).json({ error: 'Error al crear producto' });
    }
  },

  updateProducto: async (req, res) => {
    const { id } = req.params;
    const updatedFields = req.body;

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const estadosValidos = ['Activo', 'Inactivo', 'Descontinuado'];
    if (updatedFields.Estado && !estadosValidos.includes(updatedFields.Estado)) {
      return res.status(400).json({ error: `El estado '${updatedFields.Estado}' no es válido. Valores permitidos: ${estadosValidos.join(', ')}.` });
    }
    // Add other foreign key checks if those fields are updatable and need validation

    try {
      const result = await ProductoModel.update(id, updatedFields);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json({
        message: 'Producto actualizado exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      // Handle potential ER_DUP_ENTRY if unique fields are updated
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  },

  deleteProducto: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Verificar dependencias
      if (await ProductoModel.isReferencedInDetallesPedido(id, connection)) {
        await connection.rollback();
        return res.status(400).json({ error: 'No se puede eliminar el producto porque está asociado a pedidos.' });
      }
      if (await ProductoModel.isReferencedInInventario(id, connection)) {
        await connection.rollback();
        return res.status(400).json({ error: 'No se puede eliminar el producto porque tiene registros de inventario.' });
      }
      // Aquí podrías añadir más verificaciones (ej. PRODUCTOS_PROMOCION, HISTORIAL_PRECIOS)

      const result = await ProductoModel.remove(id, connection);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      await connection.commit();
      res.json({
        message: 'Producto eliminado exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al eliminar producto:', error);
      res.status(500).json({ error: 'Error al eliminar producto' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = ProductosController;
