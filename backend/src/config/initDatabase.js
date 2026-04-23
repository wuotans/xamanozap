const { getPool } = require('./database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('Verificando banco de dados...');
    
    const db = await getPool();
    
    // Criar tabela de usuários
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        organization_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela users verificada/criada');
    
    // Criar tabela de organizações
    await db.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela organizations verificada/criada');
    
    // Criar tabela de planos
    await db.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        price DECIMAL(10,2),
        features JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela plans verificada/criada');
    
    // Inserir dados iniciais se não existirem
    await insertInitialData(db);
    
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

async function insertInitialData(db) {
  try {
    // Verificar se já existe usuário admin
    const [adminExists] = await db.query('SELECT * FROM users WHERE role = ?', ['admin']);
    
    if (adminExists.length === 0) {
      console.log('Inserindo dados iniciais...');
      
      // Hash da senha padrão
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Inserir usuário admin
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@xamanozap.com', hashedPassword, 'admin']
      );
      
      // Inserir usuário comum
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Usuário Teste', 'user@teste.com', hashedPassword, 'user']
      );
      
      // Inserir organizações exemplo
      await db.query('INSERT INTO organizations (name, status) VALUES (?, ?)', ['Empresa A', 'active']);
      await db.query('INSERT INTO organizations (name, status) VALUES (?, ?)', ['Empresa B', 'active']);
      await db.query('INSERT INTO organizations (name, status) VALUES (?, ?)', ['Empresa C', 'inactive']);
      
      // Inserir planos exemplo
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Básico', 49.00, JSON.stringify(['100 contatos', '2 atendentes', 'Relatórios básicos'])]
      );
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Profissional', 99.00, JSON.stringify(['500 contatos', '5 atendentes', 'Relatórios avançados', 'API'])]
      );
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Enterprise', null, JSON.stringify(['Contatos ilimitados', 'Atendentes ilimitados', 'Suporte prioritário', 'Personalização'])]
      );
      
      console.log('Dados iniciais inseridos com sucesso!');
      console.log('Credenciais padrão:');
      console.log('Admin: admin@xamanozap.com / admin123');
      console.log('User: user@teste.com / admin123');
    } else {
      console.log('Dados iniciais já existem');
    }
    
    // Verificar se existem organizações
    const [orgs] = await db.query('SELECT * FROM organizations');
    if (orgs.length === 0) {
      await db.query('INSERT INTO organizations (name, status) VALUES (?, ?)', ['Empresa Padrão', 'active']);
      console.log('Organização padrão criada');
    }
    
    // Verificar se existem planos
    const [plans] = await db.query('SELECT * FROM plans');
    if (plans.length === 0) {
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Plano Free', 0.00, JSON.stringify(['5 contatos', '1 atendente', 'Suporte básico'])]
      );
      console.log('Plano padrão criado');
    }
    
  } catch (error) {
    console.error('Erro ao inserir dados iniciais:', error);
  }
}

module.exports = initDatabase;