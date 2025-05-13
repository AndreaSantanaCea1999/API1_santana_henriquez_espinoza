// C:\Users\andre\Desktop\API1_santana_henriquez_espinoza\src\api\controllers\productos.controller.js

// Si esta API de Inventario tiene su propio modelo de producto, impórtalo aquí
// const ProductoInventarioModel = require('../models/producto.inventario.model');

// Obtener todos los productos (del inventario)
exports.listarProductos = async (req, res, next) => {
    try {
        // Lógica para obtener todos los productos de la base de datos de esta API de Inventario
        // Ejemplo: const productos = await ProductoInventarioModel.obtenerTodos(req.query);
        const productos = [
            { id: 1, codigo_externo: "BOS-TAL-001", nombre_producto: "Taladro Percutor Bosch GSB 13 RE", precio: 69990.00, stock_disponible_total: 50, descripcion: "Taladro percutor compacto y potente." },
            { id: 2, codigo_externo: "MAK-SIE-005", nombre_producto: "Sierra Circular Makita HS7600", precio: 110990.00, stock_disponible_total: 25, descripcion: "Sierra circular de 7-1/4 pulgadas." },
            { id: 3, codigo_externo: "STA-MAR-010", nombre_producto: "Martillo Carpintero Stanley 16oz", precio: 12990.00, stock_disponible_total: 100, descripcion: "Martillo con cabeza de acero y mango de fibra." },
            { id: 4, codigo_externo: "SIK-PIN-002", nombre_producto: "Pintura Látex SikaColor-E Blanco", precio: 22500.00, stock_disponible_total: 40, descripcion: "Látex para interiores y exteriores, galón." }
        ]; // Datos de ejemplo
        console.log(`[API Inventario - ProductosController] Listando productos. Encontrados: ${productos.length}`);
        res.json(productos);
    } catch (error) {
        console.error('[API Inventario - ProductosController] Error al listar productos:', error);
        next(error); // Pasa el error al manejador de errores global de esta API
    }
};

// Obtener un producto por su ID (numérico, asumiendo que la API de Inventario usa ID numérico internamente)
exports.obtenerProductoPorId = async (req, res, next) => {
    try {
        const productoId = parseInt(req.params.id, 10);
        if (isNaN(productoId)) {
            return res.status(400).json({ error: 'El ID del producto debe ser un número.' });
        }

        // Lógica para obtener el producto de la base de datos de esta API de Inventario
        // Ejemplo: const producto = await ProductoInventarioModel.obtenerPorId(productoId);
        // Datos de ejemplo para simular:
        let producto = null;
        if (productoId === 1) {
            producto = { id: 1, codigo_externo: "BOS-TAL-001", nombre_producto: "Taladro Percutor Bosch GSB 13 RE", Precio_Venta: 69990.00, Nombre: "Taladro Percutor Bosch GSB 13 RE", stock_disponible_total: 50, descripcion: "Taladro percutor compacto y potente." };
        } else if (productoId === 2) {
            producto = { id: 2, codigo_externo: "MAK-SIE-005", nombre_producto: "Sierra Circular Makita HS7600", Precio_Venta: 110990.00, Nombre: "Sierra Circular Makita HS7600", stock_disponible_total: 25, descripcion: "Sierra circular de 7-1/4 pulgadas." };
        }
        // Añade más casos si es necesario para tus pruebas

        console.log(`[API Inventario - ProductosController] Buscando producto con ID: ${productoId}`);

        if (producto) {
            console.log(`[API Inventario - ProductosController] Producto encontrado:`, producto);
            res.json(producto);
        } else {
            console.log(`[API Inventario - ProductosController] Producto con ID ${productoId} no encontrado.`);
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error(`[API Inventario - ProductosController] Error al obtener producto por ID ${req.params.id}:`, error);
        next(error);
    }
};

// Aquí podrías tener más funciones como crearProducto, actualizarProducto, etc.
// si tu API de Inventario necesita esas funcionalidades.
