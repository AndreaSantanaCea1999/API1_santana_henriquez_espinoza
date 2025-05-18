const { Marcas, Productos } = require('../models');

// Obtener todas las marcas
exports.getAllMarcas = async (req, res) => {
  try {
    const marcas = await Marcas.findAll();
    
    return res.status(200).json({
      success: true,
      count: marcas.length,
      data: marcas
    });
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener marcas',
      message: error.message
    });
  }
};

// Obtener una marca por ID
exports.getMarcaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const marca = await Marcas.findByPk(id, {
      include: [{ model: Productos, as: 'productos' }]
    });
    
    if (!marca) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: marca
    });
  } catch (error) {
    console.error('Error al obtener marca:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener marca',
      message: error.message
    });
  }
};

// Crear una nueva marca
exports.createMarca = async (req, res) => {
  try {
    const {
      Nombre,
      Descripcion,
      Logo_URL,
      Pais_Origen,
      Sitio_Web
    } = req.body;
    
    // Obtener el máximo ID actual y calcular el siguiente
    const maxId = await Marcas.max('ID_Marca');
    const nextId = (maxId !== null ? maxId : 0) + 1;
    
    // Crear marca
    const nuevaMarca = await Marcas.create({
      ID_Marca: nextId,
      Nombre,
      Descripcion,
      Logo_URL,
      Pais_Origen,
      Sitio_Web
    });
    
    return res.status(201).json({
      success: true,
      message: 'Marca creada exitosamente',
      data: nuevaMarca
    });
  } catch (error) {
    console.error('Error al crear marca:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear marca',
      message: error.message
    });
  }
};

// Actualizar una marca
exports.updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const marca = await Marcas.findByPk(id);
    
    if (!marca) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }
    
    // Asegurar que no se cambie el ID
    delete updateData.ID_Marca;
    
    // Actualizar marca
    await marca.update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Marca actualizada exitosamente',
      data: marca
    });
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar marca',
      message: error.message
    });
  }
};

// Eliminar una marca
exports.deleteMarca = async (req, res) => {
  try {
    const { id } = req.params;
    
    const marca = await Marcas.findByPk(id);
    
    if (!marca) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }
    
    // Verificar si tiene productos asociados
    const productosAsociados = await Productos.findOne({
      where: { ID_Marca: id }
    });
    
    if (productosAsociados) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la marca porque tiene productos asociados'
      });
    }
    
    await marca.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Marca eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar marca:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar marca',
      message: error.message
    });
  }
};