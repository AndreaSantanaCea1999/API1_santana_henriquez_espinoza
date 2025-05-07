 **API de Inventario - FerreMax**

Este proyecto es una API RESTful desarrollada en Node.js con Express para gestionar las operaciones de un sistema de inventario, como productos, categorías, marcas, divisas, clientes, pedidos e inventario. Utiliza MySQL como base de datos.

 Características Principales

*   Gestión completa (CRUD) para:
    *   Productos
    *   Categorías (con jerarquía)
    *   Marcas
    *   Divisas
    *   Clientes (incluye gestión de usuarios y roles básicos)
    *   Pedidos (con detalles e historial de estados)
    *   Inventario (con movimientos)
*   Conexión a base de datos MySQL.
*   Estructura modular de rutas y controladores.
*   Manejo de transacciones para operaciones críticas.
*   Verificación de dependencias antes de eliminar registros sensibles.

 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

*   [Node.js](https://nodejs.org/) (se recomienda la versión LTS)
*   [npm](https://www.npmjs.com/) (generalmente viene con Node.js)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/) (o una alternativa compatible como MariaDB)
*   [Git](https://git-scm.com/) (para clonar el repositorio)
*   Un cliente de API como [Postman](https://www.postman.com/downloads/) (para probar los endpoints)

 Instalación

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/AndreaSantanaCea1999/API1_santana_henriquez_espinoza.git
    cd API1_santana_henriquez_espinoza
    ```
    (Reemplaza la URL si es diferente o si el nombre del directorio clonado es distinto)

2.  Instala las dependencias del proyecto:
    ```bash
    npm install
    ```

 Configuración

1.  Configura la Base de Datos:
    *   Asegúrate de que tu servidor MySQL esté corriendo.
    *   Crea una base de datos. Por defecto, la aplicación espera una base de datos llamada `ferremax`. Puedes usar el script SQL proporcionado en el proyecto (`tu_script_sql.sql` - *por favor, actualiza este nombre si tienes un script de creación de BD*) para crear las tablas y la estructura necesaria.
        ```bash
        # Ejemplo de cómo ejecutar el script desde la línea de comandos de mysql
        # mysql -u tu_usuario -p ferremax < ruta/a/tu_script_sql.sql
        ```

3.  Crea el archivo de entorno `.env`:
    En la raíz del proyecto (`C:\Users\andre\APIS-VENTA\` o donde lo hayas clonado), crea un archivo llamado `.env`. Este archivo contendrá las variables de entorno necesarias para la aplicación.

    Copia el siguiente contenido en tu archivo `.env` y ajusta los valores según tu configuración local:
    ```env
    PORT=3000

    DB_HOST=localhost
    DB_USER=administrador
    DB_PASSWORD=yR!9uL2@pX
    DB_NAME=ferremax
    DB_PORT=3306
    ```
    IMPORTANTE: Asegúrate de que `DB_USER` y `DB_PASSWORD` sean correctos para tu instancia de MySQL y que este usuario tenga los permisos necesarios sobre la base de datos `ferremax`.

 Ejecución

Una vez instaladas las dependencias y configurado el archivo `.env`, puedes iniciar el servidor API con:

```bash
npm start
```

Si todo está configurado correctamente, deberías ver un mensaje en la consola similar a:

```
Servidor API iniciado en puerto 3000
Conexión a MySQL establecida correctamente
```

La API estará disponible en `http://localhost:3000`.

 Uso de la API y Pruebas

Puedes utilizar Postman o cualquier otro cliente de API para interactuar con los endpoints.

Endpoints Principales Disponibles (base `/api`):

*   `/productos`
*   `/categorias`
*   `/marcas`
*   `/divisas`
*   `/clientes`
*   `/pedidos`
*   `/inventario`

Cada uno de estos endpoints soporta operaciones `GET`, `POST`, `PATCH`, y `DELETE` para la gestión de sus respectivas entidades. Consulta el código fuente en la carpeta `src/api/routes/` para ver las rutas específicas y los parámetros esperados.

Se recomienda crear primero las entidades base (Divisas, Categorías, Marcas) antes de crear entidades que dependan de ellas (como Productos).

 Contribuciones

Si deseas contribuir, por favor sigue los lineamientos estándar de Gitflow o realiza un fork y envía un Pull Request.
