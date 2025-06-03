const { sequelize, Usuario, Pedidos } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los usuarios
exports.getAllUsuarios = async (req, res) => {
  try {
    const { estado, buscar, page = 1, limit = 50 } = req.query;
    
    let whereClause = {};
    
    // Filtrar por estado si se proporciona
    if (estado && ['Activo', 'Inactivo', 'Suspendido'].includes(estado)) {
      whereClause.Estado = estado;
    }
    
    // Búsqueda por nombre, email o RUT
    if (buscar) {
      whereClause[Op.or] = [
        { Nombre: { [Op.like]: `%${buscar}%` } },
        { Email: { [Op.like]: `%${buscar}%` } },
        { RUT: { [Op.like]: `%${buscar}%` } }
      ];
    }
    
    // Configurar paginación
    const offset = (page - 1) * limit;
    
    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['Fecha_Registro', 'DESC']],
      attributes: { exclude: ['Ultima_Actualizacion'] } // Excluir campos sensibles si los hay
    });
    
    return res.status(200).json({
      success: true,
      count: usuarios.length,
      totalCount: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
      message: error.message
    });
  }
};

// Obtener un usuario por ID
exports.getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id, {
      include: [
        {
          model: Pedidos,
          as: 'pedidosComoCliente',
          attributes: ['ID_Pedido', 'Codigo_Pedido', 'Estado', 'Total', 'Fecha_Pedido'],
          limit: 10,
          order: [['Fecha_Pedido', 'DESC']]
        }
      ]
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener usuario',
      message: error.message
    });
  }
};

// Crear un nuevo usuario
exports.createUsuario = async (req, res) => {
  try {
    const {
      Nombre,
      Email,
      RUT,
      Telefono,
      Direccion,
      Ciudad,
      Region,
      Estado = 'Activo'
    } = req.body;
    
    // Validaciones básicas
    if (!Nombre || !Email) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'Los campos Nombre y Email son obligatorios'
      });
    }
    
    // Verificar si ya existe un usuario con ese email
    const emailExistente = await Usuario.findOne({ where: { Email } });
    if (emailExistente) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'Ya existe un usuario con ese email'
      });
    }
    
    // Verificar RUT si se proporciona
    if (RUT) {
      const rutExistente = await Usuario.findOne({ where: { RUT } });
      if (rutExistente) {
        return res.status(400).json({
          success: false,
          error: 'Error de validación',
          message: 'Ya existe un usuario con ese RUT'
        });
      }
    }
    
    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      Nombre,
      Email: Email.toLowerCase(),
      RUT: RUT ? RUT.toUpperCase() : null,
      Telefono,
      Direccion,
      Ciudad,
      Region,
      Estado,
      Fecha_Registro: new Date(),
      Ultima_Actualizacion: new Date()
    });
    
    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: nuevoUsuario
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: error.message,
        errores: error.errors?.map((e) => ({
          campo: e.path,
          tipo: e.type,
          mensaje: e.message,
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Error al crear usuario',
      message: error.message
    });
  }
};

// Actualizar un usuario
exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // No permitir cambiar ID ni fecha de registro
    delete updateData.ID_Usuario;
    delete updateData.Fecha_Registro;
    
    // Normalizar email y RUT
    if (updateData.Email) {
      updateData.Email = updateData.Email.toLowerCase();
      
      // Verificar que no exista otro usuario con ese email
      if (updateData.Email !== usuario.Email) {
        const emailExistente = await Usuario.findOne({ 
          where: { 
            Email: updateData.Email,
            ID_Usuario: { [Op.ne]: id } 
          } 
        });
        if (emailExistente) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe otro usuario con ese email'
          });
        }
      }
    }
    
    if (updateData.RUT) {
      updateData.RUT = updateData.RUT.toUpperCase();
      
      // Verificar que no exista otro usuario con ese RUT
      if (updateData.RUT !== usuario.RUT) {
        const rutExistente = await Usuario.findOne({ 
          where: { 
            RUT: updateData.RUT,
            ID_Usuario: { [Op.ne]: id } 
          } 
        });
        if (rutExistente) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe otro usuario con ese RUT'
          });
        }
      }
    }
    
    // Actualizar fecha de última modificación
    updateData.Ultima_Actualizacion = new Date();
    
    await usuario.update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuario
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario',
      message: error.message
    });
  }
};

// Eliminar un usuario
exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Verificar si tiene pedidos asociados
    const pedidosAsociados = await Pedidos.findOne({
      where: { 
        [Op.or]: [
          { ID_Cliente: id },
          { ID_Vendedor: id }
        ]
      }
    });
    
    if (pedidosAsociados) {
      // En lugar de eliminar, cambiar estado a Inactivo
      await usuario.update({ 
        Estado: 'Inactivo',
        Ultima_Actualizacion: new Date()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Usuario desactivado exitosamente (tiene pedidos asociados)'
      });
    }
    
    // Si no tiene pedidos, eliminar completamente
    await usuario.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario',
      message: error.message
    });
  }
};

// Obtener estadísticas de usuarios
exports.getEstadisticasUsuarios = async (req, res) => {
  try {
    const estadisticas = await Usuario.findAll({
      attributes: [
        'Estado',
        [sequelize.fn('COUNT', sequelize.col('ID_Usuario')), 'cantidad']
      ],
      group: ['Estado']
    });
    
    const totalUsuarios = await Usuario.count();
    
    const usuariosRecientes = await Usuario.findAll({
      where: {
        Fecha_Registro: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      },
      attributes: ['ID_Usuario', 'Nombre', 'Email', 'Fecha_Registro'],
      order: [['Fecha_Registro', 'DESC']],
      limit: 10
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalUsuarios,
        estadisticasPorEstado: estadisticas,
        usuariosRecientes
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
};