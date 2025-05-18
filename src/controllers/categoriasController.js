const { Categorias, Productos } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las categorías
exports.getAllCategorias = async (req, res) => {
  try {
    const categorias = await Categorias.findAll({
      include: [
        { model: Categorias, as: 'categoriaPadre' },
        { model: Categorias, as: 'subcategorias' }
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: categorias.length,
      data: categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener categorías',
      message: error.message
    });
  }
};

// Obtener una categoría por ID
exports.getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categorias.findByPk(id, {
      include: [
        { model: Categorias, as: 'categoriaPadre' },
        { model: Categorias, as: 'subcategorias' },
        { model: Productos, as: 'productos' }
      ]
    });
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener categoría',
      message: error.message
    });
  }
};

// Crear una nueva categoría
exports.createCategoria = async (req, res) => {
  try {
    const {
      Nombre,
      Descripcion,
      ID_Categoria_Padre,
      Nivel,
      Icono_URL,
      Orden_Visualizacion
    } = req.body;
    
    // Validar categoría padre si se proporciona
    if (ID_Categoria_Padre) {
      const categoriaPadre = await Categorias.findByPk(ID_Categoria_Padre);
      if (!categoriaPadre) {
        return res.status(404).json({
          success: false,
          error: 'La categoría padre especificada no existe'
        });
      }
    }
    
    // Obtener el máximo ID actual y calcular el siguiente
    const maxId = await Categorias.max('ID_Categoria');
    const nextId = (maxId !== null ? maxId : 0) + 1;
    
    // Crear categoría con ID explícito
    const nuevaCategoria = await Categorias.create({
      ID_Categoria: nextId,
      Nombre,
      Descripcion,
      ID_Categoria_Padre,
      Nivel: Nivel || (ID_Categoria_Padre ? 2 : 1),
      Icono_URL,
      Orden_Visualizacion
    });
    
    return res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: nuevaCategoria
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear categoría',
      message: error.message
    });
  }
};

// Actualizar una categoría
exports.updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const categoria = await Categorias.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }
    
    // Validar categoría padre si se proporciona
    if (updateData.ID_Categoria_Padre) {
      // No permitir que una categoría sea su propia padre
      if (updateData.ID_Categoria_Padre === parseInt(id)) {
        return res.status(400).json({
          success: false,
          error: 'Una categoría no puede ser su propia padre'
        });
      }
      
      const categoriaPadre = await Categorias.findByPk(updateData.ID_Categoria_Padre);
      if (!categoriaPadre) {
        return res.status(404).json({
          success: false,
          error: 'La categoría padre especificada no existe'
        });
      }
    }
    
    // Asegurar que no se intente cambiar el ID de la categoría
    delete updateData.ID_Categoria;
    
    // Actualizar categoría
    await categoria.update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoria
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar categoría',
      message: error.message
    });
  }
};

// Eliminar una categoría
exports.deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categorias.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }
    
    // Verificar si tiene productos asociados
    const productosAsociados = await Productos.findOne({
      where: { ID_Categoria: id }
    });
    
    if (productosAsociados) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }
    
    // Verificar si tiene subcategorías
    const subcategorias = await Categorias.findOne({
      where: { ID_Categoria_Padre: id }
    });
    
    if (subcategorias) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la categoría porque tiene subcategorías'
      });
    }
    
    await categoria.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar categoría',
      message: error.message
    });
  }
};

// Obtener categorías por nivel
exports.getCategoriasByNivel = async (req, res) => {
  try {
    const { nivel } = req.params;
    
    const categorias = await Categorias.findAll({
      where: { Nivel: nivel },
      include: [
        { model: Categorias, as: 'subcategorias' }
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: categorias.length,
      data: categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías por nivel:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener categorías por nivel',
      message: error.message
    });
  }
};

// Obtener subcategorías
exports.getSubcategorias = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subcategorias = await Categorias.findAll({
      where: { ID_Categoria_Padre: id },
      include: [
        { model: Productos, as: 'productos' }
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: subcategorias.length,
      data: subcategorias
    });
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener subcategorías',
      message: error.message
    });
  }
};