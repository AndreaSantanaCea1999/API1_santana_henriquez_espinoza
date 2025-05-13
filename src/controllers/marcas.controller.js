const MarcaModel = require('../models/marca.model');
const { pool } = require('../../config/db'); // For transactions

const MarcasController = {
  getAllMarcas: async (req, res) => {
    try {
      const marcas = await MarcaModel.findAll();
      res.json(marcas);
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      res.status(500).json({ error: 'Error al obtener marcas' });
    }
  },

  getMarcaById: async (req, res) => {
    const { id } = req.params;
    try {
      const marca = await MarcaModel.findById(id);
      if (!marca) {
        return res.status(404).json({ error: 'Marca no encontrada' });
      }
      res.json(marca);
    } catch (error) {
      console.error('Error al obtener marca por ID:', error);
      res.status(500).json({ error: 'Error al obtener marca' });
    }
  },

  getProductosByMarca: async (req, res) => {
    const { id } = req.params;
    try {
      // First check if marca exists
      const marca = await MarcaModel.findById(id);
      if (!marca) {
        return res.status(404).json({ error: 'Marca no encontrada' });
      }
      const productos = await MarcaModel.findProductosByMarcaId(id);
      res.json(productos); // Empty array is a valid response if no active products
    } catch (error) {
      console.error('Error al obtener productos de la marca:', error);
      res.status(500).json({ error: 'Error al obtener productos de la marca' });
    }
  },

  createMarca: async (req, res) => {
    const marcaData = req.body;
    const { Nombre } = marcaData;

    if (!Nombre) {
      return res.status(400).json({ error: 'El campo Nombre es obligatorio.' });
    }

    try {
      const result = await MarcaModel.create(marcaData);
      res.status(201).json({
        message: 'Marca creada exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('Error al crear marca:', error);
      // Add ER_DUP_ENTRY handling if Nombre is unique
      res.status(500).json({ error: 'Error al crear marca' });
    }
  },

  updateMarca: async (req, res) => {
    const { id } = req.params;
    const updatedFields = req.body;

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    if (updatedFields.Nombre !== undefined && !updatedFields.Nombre) {
      return res.status(400).json({ error: 'El campo Nombre no puede estar vacío si se intenta actualizar.' });
    }

    try {
      const result = await MarcaModel.update(id, updatedFields);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Marca no encontrada' });
      }
      res.json({
        message: 'Marca actualizada exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      // Add ER_DUP_ENTRY handling if Nombre is unique and being updated
      res.status(500).json({ error: 'Error al actualizar marca' });
    }
  },

  deleteMarca: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const productosCount = await MarcaModel.countProductosByMarca(id, connection);
      if (productosCount > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No se puede eliminar la marca porque tiene productos asociados',
          productosCount: productosCount
        });
      }

      const result = await MarcaModel.remove(id, connection);
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Marca no encontrada' });
      }

      await connection.commit();
      res.json({
        message: 'Marca eliminada exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al eliminar marca:', error);
      res.status(500).json({ error: 'Error al eliminar marca' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = MarcasController;
