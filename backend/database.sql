-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS pi5_marcenaria;
USE pi5_marcenaria;

-- 1. Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(15),
  telefone VARCHAR(20),
  email VARCHAR(255),
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Despesas da Marcenaria
CREATE TABLE IF NOT EXISTS despesas (
    id_despesa INT AUTO_INCREMENT PRIMARY KEY,
  mes_referencia DATE NOT NULL COMMENT 'Data base do mês de referência (ex: 2026-03-01)',
  faturamento_bruto DECIMAL(15,2) DEFAULT '0.00',
  manutencao_maquinas DECIMAL(10,2) DEFAULT '0.00',
  internet_telefone DECIMAL(10,2) DEFAULT '0.00',
  contador DECIMAL(10,2) DEFAULT '0.00',
  energia_eletrica DECIMAL(10,2) DEFAULT '0.00',
  imposto_perc DECIMAL(5,2) DEFAULT '0.00' COMMENT 'Porcentagem de imposto',
  taxa_cartao_perc DECIMAL(5,2) DEFAULT '0.00' COMMENT 'Porcentagem da taxa de cartão',
  fornecedores DECIMAL(15,2) DEFAULT '0.00',
  data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS despesas_adicionais (
  id_adicional INT AUTO_INCREMENT PRIMARY KEY,
  id_despesa INT,
  descricao VARCHAR(255),
  valor DECIMAL(10,2),
  tipo VARCHAR(50),
  FOREIGN KEY (id_despesa) REFERENCES despesas(id_despesa) ON DELETE CASCADE
);

-- 3. Custo de Projeto
CREATE TABLE IF NOT EXISTS custos_projetos (
  id_projeto INT AUTO_INCREMENT PRIMARY KEY,
  nome_modelo VARCHAR(255) NOT NULL, 
  mao_de_obra DECIMAL(10,2) DEFAULT 0.00,
  instalacao DECIMAL(10,2) DEFAULT 0.00,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custos_materiais_itens (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  projeto_id INT,
  material VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  unidade_medida VARCHAR(20),
  valor_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(15,2),
  FOREIGN KEY (projeto_id) REFERENCES custos_projetos(id_projeto) ON DELETE CASCADE
);

-- 4. Orçamento 
CREATE TABLE IF NOT EXISTS orcamentos (
  id_orcamento INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT,
  id_projeto INT,
  nome_projeto VARCHAR(255) NOT NULL, 
  quantidade INT DEFAULT 1,
  dias_trabalho INT DEFAULT 1,
  entrada DECIMAL(15,2) DEFAULT 0.00,
  valor_custo DECIMAL(15,2) DEFAULT 0.00,
  imposto_importacao DECIMAL(10,2) DEFAULT 0.00,
  frete DECIMAL(10,2) DEFAULT 0.00,
  custo_fixo DECIMAL(10,2) DEFAULT 0.00,
  energia_eletrica DECIMAL(10,2) DEFAULT 0.00,
  outras_var DECIMAL(10,2) DEFAULT 0.00,
  imposto DECIMAL(10,2) DEFAULT 0.00,
  taxa_cartao DECIMAL(10,2) DEFAULT 0.00,
  margem_lucro DECIMAL(5,2) DEFAULT 0.00,
  preco_sugerido DECIMAL(15,2) DEFAULT 0.00,
  preco_final_impresso DECIMAL(15,2) DEFAULT 0.00,
  desconto DECIMAL(5,2) DEFAULT 0,
  situacao VARCHAR(20) DEFAULT 'aberto',
  data_orcamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL,
  FOREIGN KEY (id_projeto) REFERENCES custos_projetos(id_projeto) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orcamentos_extras (
  id_extra INT AUTO_INCREMENT PRIMARY KEY,
  id_orcamento INT,
  descricao VARCHAR(255),
  valor DECIMAL(10,2),
  FOREIGN KEY (id_orcamento) REFERENCES orcamentos(id_orcamento) ON DELETE CASCADE
);

-- 5. Plano de Corte
CREATE TABLE IF NOT EXISTS planos_corte (
  id_plano INT AUTO_INCREMENT PRIMARY KEY,
  id_orcamento INT, 
  espessura_serra DECIMAL(5,2) DEFAULT 3.00,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_orcamento) REFERENCES orcamentos(id_orcamento) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS planos_corte_chapa (
  id_chapa INT AUTO_INCREMENT PRIMARY KEY,
  id_plano INT,
  largura DECIMAL(10,2) NOT NULL,
  altura DECIMAL(10,2) NOT NULL,
  material VARCHAR(255) DEFAULT '',
  FOREIGN KEY (id_plano) REFERENCES planos_corte(id_plano) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS planos_corte_peca (
  id_peca INT AUTO_INCREMENT PRIMARY KEY,
  id_chapa INT,
  nome_peca VARCHAR(255) NOT NULL,
  largura DECIMAL(10,2) NOT NULL,
  altura DECIMAL(10,2) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  FOREIGN KEY (id_chapa) REFERENCES planos_corte_chapa(id_chapa) ON DELETE CASCADE
);
