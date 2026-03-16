const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function inicializarBanco() {
  try {
    // Conecta sem especificar o banco de dados ainda
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      multipleStatements: true 
    });

    const dbName = process.env.DB_NAME || 'pi5_marcenaria';

    // Cria o banco se não existir e o seleciona
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    // Lê o arquivo SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf-8');

    // Executa as queries
    await connection.query(sqlScript);
    console.log("Banco de dados verificado e inicializado com sucesso.");

    await connection.end();
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
  }
}

inicializarBanco();