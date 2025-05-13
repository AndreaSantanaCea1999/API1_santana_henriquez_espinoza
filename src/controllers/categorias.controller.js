const CategoriaModel = require('../models/categoria.model');
const { pool } = require('../../config/db'); // For transactions

const CategoriasController = {
  getAllCategorias: async (req, res) => {
    try {
      const categorias = await CategoriaModel.findAll();
      res.json(categorias);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({ error: 'Error al obtener categorías' });
    }
  },

  getCategoriasPadre: async (req, res) => {
    try {
      const categoriasPadre = await CategoriaModel.findPadres();
      res.json(categoriasPadre);
    } catch (error) {
      console.error('Error al obtener categorías padre:', error);
      res.status(500).json({ error: 'Error al obtener categorías padre' });
    }
  },

  getCategoriaById: async (req, res) => {
    const { id } = req.params;
    try {
      const categoria = await CategoriaModel.findById(id);
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      res.json(categoria);
    } catch (error) {
      console.error('Error al obtener categoría por ID:', error);
      res.status(500).json({ error: 'Error al obtener categoría' });
    }
  },

  getSubcategorias: async (req, res) => {
    const { id } = req.params;
    try {
      // Optional: Check if parent category exists first
      const parentCategoria = await CategoriaModel.findById(id);
      if (!parentCategoria) {
          return res.status(404).json({ error: 'Categoría padre no encontrada' });
      }
      const subcategorias = await CategoriaModel.findSubcategorias(id);
      res.json(subcategorias); // Empty array is a valid response
    } catch (error) {
      console.error('Error al obtener subcategorías:', error);
      res.status(500).json({ error: 'Error al obtener subcategorías' });
    }
  },

  getProductosByCategoria: async (req, res) => {
    const { id } = req.params;
    try {
      // Optional: Check if category exists first
      const categoria = await CategoriaModel.findById(id);
      if (!categoria) {
          return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      const productos = await CategoriaModel.findProductosByCategoriaId(id);
      res.json(productos); // Empty array is a valid response
    } catch (error) {
      console.error('Error al obtener productos de la categoría:', error);
      res.status(500).json({ error: 'Error al obtener productos de la categoría' });
    }
  },

  createCategoria: async (req, res) => {
    const categoriaData = req.body;
    const { Nombre, Nivel, ID_Categoria_Padre } = categoriaData;

    if (!Nombre) {
      return res.status(400).json({ error: 'El campo Nombre es obligatorio.' });
    }
    if (Nivel === undefined || typeof Nivel !== 'number' || Nivel < 0 || !Number.isInteger(Nivel)) {
      return res.status(400).json({ error: 'El campo Nivel es obligatorio y debe ser un entero no negativo.' });
    }

    try {
      if (ID_Categoria_Padre !== null && ID_Categoria_Padre !== undefined) {
        if (!await CategoriaModel.checkParentExists(ID_Categoria_Padre)) {
          return res.status(400).json({ error: `La categoría padre con ID ${ID_Categoria_Padre} no existe.` });
        }
      }

      const result = await CategoriaModel.create(categoriaData);
      res.status(201).json({
        message: 'Categoría creada exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      // Add ER_DUP_ENTRY handling if Nombre is unique
      res.status(500).json({ error: 'Error al crear categoría' });
    }
  },

  updateCategoria: async (req, res) => {
    const { id } = req.params;
    const updatedFields = req.body;

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    if (updatedFields.Nivel !== undefined) {
      if (typeof updatedFields.Nivel !== 'number' || updatedFields.Nivel < 0 || !Number.isInteger(updatedFields.Nivel)) {
        return res.status(400).json({ error: 'El campo Nivel debe ser un entero no negativo.' });
      }
    }

    if (updatedFields.ID_Categoria_Padre !== undefined && updatedFields.ID_Categoria_Padre !== null) {
      if (updatedFields.ID_Categoria_Padre === parseInt(id, 10)) {
        return res.status(400).json({ error: 'Una categoría no puede ser su propia categoría padre.' });
      }
    }

    try {
      if (updatedFields.ID_Categoria_Padre !== undefined) { // Check even if it's null
        if (!await CategoriaModel.checkParentExists(updatedFields.ID_Categoria_Padre)) {
          return res.status(400).json({ error: `La categoría padre con ID ${updatedFields.ID_Categoria_Padre} no existe.` });
        }
      }

      const result = await CategoriaModel.update(id, updatedFields);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      res.json({
        message: 'Categoría actualizada exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({ error: 'Error al actualizar categoría' });
    }
  },

  deleteCategoria: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const subcategoriasCount = await CategoriaModel.countSubcategorias(id, connection);
      if (subcategoriasCount > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No se puede eliminar la categoría porque tiene subcategorías',
          subcategoriasCount: subcategoriasCount
        });
      }

      const productosCount = await CategoriaModel.countProductosByCategoria(id, connection);
      if (productosCount > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No se puede eliminar la categoría porque tiene productos asociados',
          productosCount: productosCount
        });
      }

      const result = await CategoriaModel.remove(id, connection);
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      await connection.commit();
      res.json({
        message: 'Categoría eliminada exitosamente',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({ error: 'Error al eliminar categoría' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = CategoriasController;
