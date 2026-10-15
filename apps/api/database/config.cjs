const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    logging: false,
  },
};
