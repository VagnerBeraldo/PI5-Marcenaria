const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', 
  password: 'root', 
  database: 'pi5_marcenaria',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados pi5_marcenaria com sucesso!');
    connection.release();
  }
});


module.exports = pool.promise();