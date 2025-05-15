const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,       // ferremax
  process.env.DB_USER,       // administrador
  process.env.DB_PASSWORD,   // yR!9uL2@pX
  {
    host: process.env.DB_HOST,     // localhost
    dialect: 'mysql',
    port: process.env.DB_PORT,     // 3306
    define: {
      freezeTableName: true,
      timestamps: false
    },
    logging: false
  }
);

module.exports = sequelize;
