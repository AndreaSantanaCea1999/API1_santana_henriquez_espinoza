// c:\Users\andre\Desktop\API1_santana_henriquez_espinoza\src\controllers\productos.controller.js

const { pool } = require('../config/db'); // Ajusta la ruta si es diferente

// Listar todos los productos (o filtrar por estado, etc.)
exports.listarProductos = async (req, res, next) => {
    try {
        // Podrías añadir filtros desde req.query, por ejemplo: ?estado=Activo
        const { estado } = req.query;
        let query = 'SELECT * FROM PRODUCTOS';
        const queryParams = [];

        if (estado) {
            query += ' WHERE Estado = ?';
            queryParams.push(estado);
        }
        query += ' ORDER BY Nombre';

        console.log(`[API Inventario - ProductosController] Listando productos. Query: ${query}`, queryParams);
        const [productos] = await pool.query(query, queryParams);
        console.log(`[API Inventario - ProductosController] Encontrados: ${productos.length}`);
        res.json(productos);
    } catch (error) {
        console.error('[API Inventario - ProductosController] Error al listar productos:', error);
        next(error);
    }
};

// Obtener un producto por su ID (numérico) o Código (string)
exports.obtenerProductoPorIdOCodigo = async (req, res, next) => {
    const { id_o_codigo } = req.params;
    try {
        let query = 'SELECT * FROM PRODUCTOS WHERE ';
        const queryParams = [id_o_codigo];

        if (isNaN(parseInt(id_o_codigo, 10))) { // Si no es un número, asumimos que es un Código
            query += 'Codigo = ?';
        } else {
            query += 'ID_Producto = ?';
        }

        console.log(`[API Inventario - ProductosController] Buscando producto. Query: ${query}`, queryParams);
        const [rows] = await pool.query(query, queryParams);

        if (rows.length === 0) {
            console.log(`[API Inventario - ProductosController] Producto con ID/Código ${id_o_codigo} no encontrado.`);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        console.log(`[API Inventario - ProductosController] Producto encontrado:`, rows[0]);
        res.json(rows[0]);
    } catch (error) {
        console.error(`[API Inventario - ProductosController] Error al obtener producto por ID/Código ${id_o_codigo}:`, error);
        next(error);
    }
};

// Crear un nuevo producto
exports.crearProducto = async (req, res, next) => {
    const {
        Codigo, Nombre, Descripcion, Precio_Compra_Neto, Precio_Venta_Neto,
        Precio_Venta_Bruto, ID_Marca, ID_Categoria, ID_Proveedor, Unidad_Medida,
        Peso_kg, Dimensiones, SKU, UPC_EAN, Estado = 'Activo', Es_Servicio = 0,
        Control_Stock = 1, ID_Divisa
    } = req.body;

    if (!Codigo || !Nombre || Precio_Venta_Neto === undefined || !ID_Marca || !ID_Categoria || !ID_Divisa) {
        return res.status(400).json({ error: 'Los campos Codigo, Nombre, Precio_Venta_Neto, ID_Marca, ID_Categoria e ID_Divisa son obligatorios.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Validar FKs
        const [marcaExists] = await connection.query('SELECT ID_Marca FROM MARCAS WHERE ID_Marca = ?', [ID_Marca]);
        if (marcaExists.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: `La marca con ID ${ID_Marca} no existe.` });
        }
        const [categoriaExists] = await connection.query('SELECT ID_Categoria FROM CATEGORIAS WHERE ID_Categoria = ?', [ID_Categoria]);
        if (categoriaExists.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: `La categoría con ID ${ID_Categoria} no existe.` });
        }
        const [divisaExists] = await connection.query('SELECT ID_Divisa FROM DIVISAS WHERE ID_Divisa = ?', [ID_Divisa]);
        if (divisaExists.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: `La divisa con ID ${ID_Divisa} no existe.` });
        }
        if (ID_Proveedor) {
            const [proveedorExists] = await connection.query('SELECT ID_Proveedor FROM PROVEEDORES WHERE ID_Proveedor = ?', [ID_Proveedor]);
            if (proveedorExists.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: `El proveedor con ID ${ID_Proveedor} no existe.` });
            }
        }

        const query = `INSERT INTO PRODUCTOS (
                Codigo, Nombre, Descripcion, Precio_Compra_Neto, Precio_Venta_Neto,
                Precio_Venta_Bruto, ID_Marca, ID_Categoria, ID_Proveedor, Unidad_Medida,
                Peso_kg, Dimensiones, SKU, UPC_EAN, Estado, Es_Servicio,
                Control_Stock, ID_Divisa, Fecha_Creacion, Fecha_Actualizacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

        const values = [
            Codigo, Nombre, Descripcion, Precio_Compra_Neto, Precio_Venta_Neto,
            Precio_Venta_Bruto, ID_Marca, ID_Categoria, ID_Proveedor, Unidad_Medida,
            Peso_kg, Dimensiones, SKU, UPC_EAN, Estado, Es_Servicio,
            Control_Stock, ID_Divisa
        ];

        console.log(`[API Inventario - ProductosController] Creando producto. Query: ${query}`);
        const [result] = await connection.query(query, values);
        await connection.commit();

        console.log(`[API Inventario - ProductosController] Producto creado con ID: ${result.insertId}`);
        res.status(201).json({
            message: 'Producto creado exitosamente',
            id_producto: result.insertId,
            codigo: Codigo
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('[API Inventario - ProductosController] Error al crear producto:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.toLowerCase().includes('codigo')) {
                 return res.status(409).json({ error: `El código de producto '${Codigo}' ya existe.` });
            }
            if (error.sqlMessage.toLowerCase().includes('sku') && SKU) {
                 return res.status(409).json({ error: `El SKU '${SKU}' ya existe.` });
            }
             return res.status(409).json({ error: 'Error de duplicado al crear el producto.', detalle: error.sqlMessage });
        }
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

// Actualizar un producto existente
exports.actualizarProducto = async (req, res, next) => {
    const productoId = parseInt(req.params.id, 10);
    const updatedFields = req.body;

    if (isNaN(productoId)) {
        return res.status(400).json({ error: 'El ID del producto debe ser un número.' });
    }
    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
    }

    // No permitir actualizar ID_Producto o Codigo directamente por esta vía general
    // Si se necesita cambiar Codigo, podría ser un endpoint específico o con validaciones más estrictas.
    delete updatedFields.ID_Producto;
    // delete updatedFields.Codigo; // Descomentar si no se permite actualizar Codigo

    const camposPermitidos = [
        "Nombre", "Descripcion", "Precio_Compra_Neto", "Precio_Venta_Neto",
        "precio_venta_bruto", "ID_Marca", "ID_Categoria", "ID_Proveedor",
        "Unidad_Medida", "Peso_kg", "Dimensiones", "SKU", "UPC_EAN",
        "Estado", "Es_Servicio", "Control_Stock", "ID_Divisa", "Codigo" // Permitir Codigo con cuidado
    ];

    const setClauses = [];
    const values = [];
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        for (const key in updatedFields) {
            if (updatedFields.hasOwnProperty(key) && camposPermitidos.includes(key)) {
                // Validar FKs si se están actualizando
                if (key === 'ID_Marca' && updatedFields[key] !== null) {
                    const [fkExists] = await connection.query('SELECT ID_Marca FROM MARCAS WHERE ID_Marca = ?', [updatedFields[key]]);
                    if (fkExists.length === 0) throw new Error(`La marca con ID ${updatedFields[key]} no existe.`);
                }
                if (key === 'ID_Categoria' && updatedFields[key] !== null) {
                    const [fkExists] = await connection.query('SELECT ID_Categoria FROM CATEGORIAS WHERE ID_Categoria = ?', [updatedFields[key]]);
                    if (fkExists.length === 0) throw new Error(`La categoría con ID ${updatedFields[key]} no existe.`);
                }
                if (key === 'ID_Divisa' && updatedFields[key] !== null) {
                    const [fkExists] = await connection.query('SELECT ID_Divisa FROM DIVISAS WHERE ID_Divisa = ?', [updatedFields[key]]);
                    if (fkExists.length === 0) throw new Error(`La divisa con ID ${updatedFields[key]} no existe.`);
                }
                if (key === 'ID_Proveedor' && updatedFields[key] !== null) {
                    const [fkExists] = await connection.query('SELECT ID_Proveedor FROM PROVEEDORES WHERE ID_Proveedor = ?', [updatedFields[key]]);
                    if (fkExists.length === 0) throw new Error(`El proveedor con ID ${updatedFields[key]} no existe.`);
                }

                setClauses.push(`${key} = ?`);
                values.push(updatedFields[key]);
            }
        }

        if (setClauses.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Ninguno de los campos proporcionados es actualizable o válido.' });
        }

        setClauses.push('Fecha_Actualizacion = CURRENT_TIMESTAMP');
        values.push(productoId); // Para la cláusula WHERE

        const query = `UPDATE PRODUCTOS SET ${setClauses.join(', ')} WHERE ID_Producto = ?`;

        console.log(`[API Inventario - ProductosController] Actualizando producto ID: ${productoId}. Query: ${query}`);
        const [result] = await connection.query(query, values);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            console.log(`[API Inventario - ProductosController] Producto con ID ${productoId} no encontrado para actualizar.`);
            return res.status(404).json({ error: 'Producto no encontrado o ningún dato modificado.' });
        }
        
        await connection.commit();
        console.log(`[API Inventario - ProductosController] Producto ID ${productoId} actualizado.`);
        res.json({ message: 'Producto actualizado exitosamente', affectedRows: result.affectedRows });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`[API Inventario - ProductosController] Error al actualizar producto por ID ${productoId}:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            // Ser más específico sobre qué campo causó el duplicado
            if (updatedFields.Codigo && error.sqlMessage.toLowerCase().includes('codigo')) {
                 return res.status(409).json({ error: `El código de producto '${updatedFields.Codigo}' ya está en uso.` });
            }
            if (updatedFields.SKU && error.sqlMessage.toLowerCase().includes('sku')) {
                 return res.status(409).json({ error: `El SKU '${updatedFields.SKU}' ya está en uso.` });
            }
            return res.status(409).json({ error: 'Error de duplicado al actualizar el producto.', detalle: error.sqlMessage });
        }
        // Si el error es por FK no existente (lanzado manualmente)
        if (error.message.includes('no existe')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

// Eliminar un producto
exports.eliminarProducto = async (req, res, next) => {
    const productoId = parseInt(req.params.id, 10);

    if (isNaN(productoId)) {
        return res.status(400).json({ error: 'El ID del producto debe ser un número.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Verificar dependencias antes de eliminar
        // 1. En DETALLES_PEDIDO
        const [detallesPedido] = await connection.query('SELECT COUNT(*) as count FROM DETALLES_PEDIDO WHERE ID_Producto = ?', [productoId]);
        if (detallesPedido[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ error: `No se puede eliminar el producto porque está asociado a ${detallesPedido[0].count} detalles de pedido.` });
        }

        // 2. En INVENTARIO
        const [inventario] = await connection.query('SELECT COUNT(*) as count FROM INVENTARIO WHERE ID_Producto = ?', [productoId]);
        if (inventario[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ error: `No se puede eliminar el producto porque tiene ${inventario[0].count} registros de inventario asociados.` });
        }
        
        // 3. En HISTORIAL_PRECIOS (si existe y es relevante)
        // const [historialPrecios] = await connection.query('SELECT COUNT(*) as count FROM HISTORIAL_PRECIOS WHERE ID_Producto = ?', [productoId]);
        // if (historialPrecios[0].count > 0) {
        //     await connection.rollback();
        //     return res.status(400).json({ error: `No se puede eliminar el producto porque tiene ${historialPrecios[0].count} registros en el historial de precios.` });
        // }


        console.log(`[API Inventario - ProductosController] Intentando eliminar producto ID: ${productoId}`);
        const [result] = await connection.query('DELETE FROM PRODUCTOS WHERE ID_Producto = ?', [productoId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            console.log(`[API Inventario - ProductosController] Producto con ID ${productoId} no encontrado para eliminar.`);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        await connection.commit();
        console.log(`[API Inventario - ProductosController] Producto ID ${productoId} eliminado.`);
        res.json({ message: 'Producto eliminado exitosamente', affectedRows: result.affectedRows });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`[API Inventario - ProductosController] Error al eliminar producto ID ${productoId}:`, error);
        next(error);
    } finally {
        if (connection) connection.release();
    }
};
