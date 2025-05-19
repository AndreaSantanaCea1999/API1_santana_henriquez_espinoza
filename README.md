# FERREMAS - API de Inventario y Productos

## Descripción

Esta API/Webservice ha sido desarrollada para "FERREMAS" con el objetivo de gestionar la información detallada de productos, incluyendo precios, modelos, marcas, códigos y stock.

La API está diseñada para dos propósitos principales:
1.  **Consumo Interno:** Permitir que las distintas sucursales de "FERREMAS" puedan realizar pedidos y mantener un inventario apropiado para sus ventas locales.
2.  **Consumo Externo:** Permitir que otras tiendas puedan consultar precios y detalles de productos desde sus propias aplicaciones.

El proyecto también contempla la futura integración con el sistema de pagos "WEBPAY" para compras online y una API de conversión de divisas del Banco Central de Chile para gestionar pedidos desde el extranjero.

## Tecnologías Utilizadas

*   **Node.js:** Entorno de ejecución para JavaScript del lado del servidor.
*   **Express.js:** Framework web para Node.js, utilizado para construir la API RESTful.
*   **Sequelize:** ORM (Object-Relational Mapper) para Node.js, utilizado para interactuar con la base de datos.
*   **MySQL:** Sistema de gestión de bases de datos relacional.
*   **dotenv:** Módulo para cargar variables de entorno desde un archivo `.env`.
*   **cors:** Middleware para habilitar CORS (Cross-Origin Resource Sharing).

## Estructura del Proyecto

```
src/
├── config/
│   └── database.js         # Configuración de la conexión a la base de datos
├── controllers/            # Lógica de negocio para cada ruta
│   ├── categoriasController.js
│   ├── inventarioController.js
│   ├── marcasController.js
│   ├── movimientosInventarioController.js
│   ├── productosController.js
│   └── proveedoresController.js
├── models/                 # Definiciones de los modelos de Sequelize y sus relaciones
│   ├── categorias.js
│   ├── index.js            # Inicializa modelos y define relaciones
│   ├── inventario.js
│   ├── marcas.js
│   ├── movimientosInventario.js
│   ├── productos.js
│   └── proveedores.js
├── routes/                 # Definiciones de las rutas de la API
│   ├── categoriasRoutes.js
│   ├── index.js            # Enrutador principal
│   ├── inventarioRoutes.js
│   ├── marcasRoutes.js
│   ├── movimientosInventarioRoutes.js
│   ├── productosRoutes.js
│   └── proveedoresRoutes.js
└── app.js                  # Archivo principal de la aplicación Express
.env                        # Archivo para variables de entorno (no versionado)
.gitignore
package.json
README.md
```

## Configuración del Entorno

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-del-directorio-del-proyecto>
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura y complétalo con tus credenciales de base de datos:
    ```env
    DB_NAME=ferremax
    DB_USER=root
    DB_PASSWORD=tu_contraseña_de_mysql
    DB_HOST=localhost
    DB_PORT=3306
    PORT=3000
    ```

4.  **Base de Datos:**
    Asegúrate de tener una instancia de MySQL corriendo y crea una base de datos con el nombre especificado en `DB_NAME` (por defecto `ferremax`).
    Los modelos de Sequelize se encargarán de crear las tablas si no existen, o puedes usar migraciones si las implementas.

## Cómo Ejecutar la Aplicación

Para iniciar el servidor API, ejecuta:
```bash
npm start
```
El servidor se ejecutará en `http://localhost:3000` (o el puerto especificado en `PORT`).

## Endpoints Principales de la API

Todas las rutas están prefijadas con `/api`.

*   **Proveedores:** `/proveedores`
    *   `GET /`: Obtener todos los proveedores.
    *   `GET /:id`: Obtener un proveedor por ID.
    *   `POST /`: Crear un nuevo proveedor (requiere `ID_Proveedor` manual).
    *   `PUT /:id`: Actualizar un proveedor.
    *   `DELETE /:id`: Eliminar un proveedor.
*   **Productos:** `/productos`
    *   `GET /`: Obtener todos los productos.
    *   `GET /:id`: Obtener un producto por ID.
    *   `POST /`: Crear un nuevo producto (`ID_Producto` es auto-incremental).
    *   `PUT /:id`: Actualizar un producto.
    *   `DELETE /:id`: Eliminar un producto.
*   **Categorías:** `/categorias` (CRUD similar, `ID_Categoria` auto-incremental)
*   **Marcas:** `/marcas` (CRUD similar, requiere `ID_Marca` manual)
*   **Inventario:** `/inventario`
    *   `GET /`: Obtener todo el inventario.
    *   `GET /:id`: Obtener inventario por su ID.
    *   `GET /producto/:productoId`: Obtener inventario por ID de producto.
    *   `POST /`: Crear un registro de inventario (`ID_Inventario` auto-incremental).
    *   `PUT /:id`: Actualizar un registro de inventario.
    *   `DELETE /:id`: Eliminar un registro de inventario.
    *   `DELETE /producto/:productoId`: Eliminar todos los registros de inventario y sus movimientos asociados para un producto específico.
*   **Movimientos de Inventario:** `/movimientos`
    *   `GET /`: Obtener todos los movimientos.
    *   `GET /:id`: Obtener un movimiento por ID.
    *   `POST /`: Crear un nuevo movimiento (`ID_Movimiento` auto-incremental).
    *   `PUT /:id`: Actualizar un movimiento (generalmente solo campos no críticos como comentarios).
    *   `DELETE /:id`: Eliminar un movimiento (revierte el impacto en el stock).
    *   Rutas adicionales para filtrar por inventario, fecha, tipo y generar reportes.

## Pruebas

Se recomienda utilizar Postman para probar los diferentes endpoints de la API.

1.  Importa la colección de Postman (si se proporciona) o crea solicitudes manualmente para cada endpoint.
2.  Asegúrate de que el servidor API esté corriendo.
3.  Envía solicitudes a los endpoints con los datos apropiados en el cuerpo (para POST y PUT) y verifica las respuestas (códigos de estado y cuerpos JSON).

## Contribuciones

Por favor, sigue las guías de estilo y contribución del proyecto si deseas colaborar.

## Licencia

propietaria
