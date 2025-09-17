-- Script para criar o banco de dados ReciclaFácil
-- Execute este script no phpMyAdmin ou MySQL

CREATE DATABASE IF NOT EXISTS reciclafacil;
USE reciclafacil;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'cooperativa') NOT NULL,
    status ENUM('ativo', 'inativo', 'pendente') DEFAULT 'pendente',
    organizacao VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    cnpj VARCHAR(18),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pontos_coleta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    telefone VARCHAR(20),
    horario_funcionamento VARCHAR(100),
    status ENUM('disponivel', 'limitado', 'manutencao') DEFAULT 'disponivel',
    responsavel_id INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS materiais_ponto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ponto_id INT NOT NULL,
    material VARCHAR(50) NOT NULL,
    FOREIGN KEY (ponto_id) REFERENCES pontos_coleta(id) ON DELETE CASCADE
);

INSERT INTO usuarios (nome, email, senha, tipo, status, organizacao, telefone, endereco) VALUES
('Administrador', 'admin@reciclafacil.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ativo', 'ReciclaFácil', '', ''),
('João Silva', 'cooperativa@exemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cooperativa', 'ativo', 'Cooperativa Verde Ltda.', '(11) 99999-9999', 'Rua das Flores, 123 - Centro - São Paulo/SP');

INSERT INTO pontos_coleta (nome, endereco, telefone, horario_funcionamento, status, responsavel_id) VALUES
('EcoPonto Centro', 'Rua das Flores, 123 - Centro - São Paulo/SP', '(11) 99999-9999', 'Seg-Sex: 8h-17h', 'disponivel', 2),
('Cooperativa Sustentável', 'Av. Sustentável, 456 - Bairro Novo - São Paulo/SP', '(11) 88888-8888', 'Seg-Sáb: 7h-16h', 'limitado', 2),
('Recicla Mais', 'Rua Ecológica, 789 - Vila Verde - São Paulo/SP', '(11) 77777-7777', 'Ter-Dom: 9h-18h', 'disponivel', 2);

INSERT INTO materiais_ponto (ponto_id, material) VALUES
(1, 'papel'),
(1, 'plastico'),
(1, 'vidro'),
(2, 'metal'),
(2, 'eletronicos'),
(3, 'papel'),
(3, 'plastico'),
(3, 'metal');
