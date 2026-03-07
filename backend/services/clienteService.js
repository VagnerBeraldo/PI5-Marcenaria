const db = require('../config/db');

const getClientes = async () => {
  const [rows] = await db.query('SELECT * FROM clientes ORDER BY nome ASC');
  return rows;
};

const getClienteById = async (id) => {
  const [rows] = await db.query('SELECT * FROM clientes WHERE id_cliente = ?', [id]);
  return rows[0];
};

const createCliente = async (data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const query = `
      INSERT INTO clientes 
      (nome, logradouro, numero, complemento, bairro, cidade, estado, cep, telefone, email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.nome, data.logradouro, data.numero || null, data.complemento || null, 
      data.bairro || null, data.cidade || null, data.estado || null, 
      data.cep || null, data.telefone || null, data.email || null
    ];
    const [result] = await connection.query(query, values);
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateCliente = async (id, data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const query = `
      UPDATE clientes SET 
      nome = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, 
      cidade = ?, estado = ?, cep = ?, telefone = ?, email = ? 
      WHERE id_cliente = ?
    `;
    const values = [
      data.nome, data.logradouro, data.numero || null, data.complemento || null, 
      data.bairro || null, data.cidade || null, data.estado || null, 
      data.cep || null, data.telefone || null, data.email || null, 
      id
    ];
    const [result] = await connection.query(query, values);
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteCliente = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
};