const mysql = require('mysql2');
require('dotenv').config();

// Configuração sem database inicial (para criar o banco)
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool principal (será recriado após criar o banco)
let pool = null;

// Função para criar o banco se não existir
async function createDatabaseIfNotExists() {
  const connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password
  });
  
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      
      const dbName = process.env.DB_NAME || 'xamanozap';
      connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Banco de dados '${dbName}' verificado/criado`);
          resolve();
        }
        connection.end();
      });
    });
  });
}

// Inicializar pool de conexões
async function initPool() {
  await createDatabaseIfNotExists();
  
  const dbName = process.env.DB_NAME || 'xamanozap';
  pool = mysql.createPool({
    ...config,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
  
  return pool.promise();
}

// Exportar função para obter o pool
module.exports = {
  getPool: async () => {
    if (!pool) {
      await initPool();
    }
    return pool.promise();
  },
  initPool
};