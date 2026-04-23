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
        full_name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        organization_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela users verificada/criada');
    
    // Criar tabela de organizações com todos os campos
    await db.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100),
        document VARCHAR(50),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        plan VARCHAR(50) DEFAULT 'basic',
        status ENUM('active', 'inactive') DEFAULT 'active',
        max_users INT DEFAULT 3,
        max_connections INT DEFAULT 1,
        max_queues INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela organizations verificada/criada');
    
    // Criar tabela de membros
    await db.query(`
      CREATE TABLE IF NOT EXISTS members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        organization_id INT NOT NULL,
        user_email VARCHAR(100) NOT NULL,
        user_name VARCHAR(100),
        role ENUM('owner', 'admin', 'member') DEFAULT 'member',
        status ENUM('active', 'inactive') DEFAULT 'active',
        queues JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        INDEX idx_organization_id (organization_id),
        INDEX idx_user_email (user_email)
      )
    `);
    console.log('Tabela members verificada/criada');
    
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
    const [adminExists] = await db.query('SELECT * FROM users WHERE email = ?', ['admin@xamanozap.com']);
    
    if (adminExists.length === 0) {
      console.log('Inserindo dados iniciais...');
      
      // Hash da senha padrão
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Inserir usuário admin
      await db.query(
        'INSERT INTO users (name, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        ['Administrador', 'Admin Master', 'admin@xamanozap.com', hashedPassword, 'admin']
      );
      
      // Inserir usuário comum
      await db.query(
        'INSERT INTO users (name, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        ['Usuário Teste', 'Test User', 'user@teste.com', hashedPassword, 'user']
      );
      
      // Inserir organizações exemplo
      await db.query(
        'INSERT INTO organizations (name, slug, phone, plan, status, max_users, max_connections, max_queues) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['Empresa A', 'empresa-a', '(11) 99999-1111', 'professional', 'active', 10, 3, 5]
      );
      
      await db.query(
        'INSERT INTO organizations (name, slug, phone, plan, status, max_users, max_connections, max_queues) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['Empresa B', 'empresa-b', '(11) 99999-2222', 'basic', 'active', 5, 2, 3]
      );
      
      await db.query(
        'INSERT INTO organizations (name, slug, phone, plan, status, max_users, max_connections, max_queues) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['Empresa C', 'empresa-c', '(11) 99999-3333', 'enterprise', 'inactive', 50, 10, 20]
      );
      
      // Inserir membros para as organizações
      const [orgs] = await db.query('SELECT id FROM organizations WHERE name IN (?, ?)', ['Empresa A', 'Empresa B']);
      
      if (orgs.length >= 2) {
        // Membro owner para Empresa A
        await db.query(
          'INSERT INTO members (organization_id, user_email, user_name, role, status, queues) VALUES (?, ?, ?, ?, ?, ?)',
          [orgs[0].id, 'admin@xamanozap.com', 'Administrador', 'owner', 'active', JSON.stringify([])]
        );
        
        // Membro owner para Empresa B
        await db.query(
          'INSERT INTO members (organization_id, user_email, user_name, role, status, queues) VALUES (?, ?, ?, ?, ?, ?)',
          [orgs[1].id, 'user@teste.com', 'Usuário Teste', 'admin', 'active', JSON.stringify([])]
        );
        
        // Atualizar organization_id dos usuários
        await db.query('UPDATE users SET organization_id = ? WHERE email = ?', [orgs[0].id, 'admin@xamanozap.com']);
        await db.query('UPDATE users SET organization_id = ? WHERE email = ?', [orgs[1].id, 'user@teste.com']);
      }
      
      // Inserir planos exemplo
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Básico', 49.00, JSON.stringify(['100 contatos', '2 atendentes', 'Relatórios básicos', 'API básica'])]
      );
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Profissional', 99.00, JSON.stringify(['500 contatos', '5 atendentes', 'Relatórios avançados', 'API completa', 'Suporte prioritário'])]
      );
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Enterprise', 299.00, JSON.stringify(['Contatos ilimitados', 'Atendentes ilimitados', 'Suporte 24/7', 'Personalização completa', 'API dedicada'])]
      );
      
      console.log('Dados iniciais inseridos com sucesso!');
      console.log('Credenciais padrão:');
      console.log('Admin: admin@xamanozap.com / admin123');
      console.log('User: user@teste.com / admin123');
    } else {
      console.log('Dados iniciais já existem');
      
      // Debug: mostrar usuários existentes
      const [users] = await db.query('SELECT id, name, email, role FROM users');
      console.log('Usuários no banco:', users.length);
    }
    
    // Verificar se existem organizações
    const [orgs] = await db.query('SELECT * FROM organizations');
    if (orgs.length === 0) {
      await db.query(
        'INSERT INTO organizations (name, slug, plan, status) VALUES (?, ?, ?, ?)',
        ['Empresa Padrão', 'empresa-padrao', 'basic', 'active']
      );
      console.log('Organização padrão criada');
    }
    
    // Verificar se existem planos
    const [plans] = await db.query('SELECT * FROM plans');
    if (plans.length === 0) {
      await db.query(
        'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
        ['Gratuito', 0.00, JSON.stringify(['5 contatos', '1 atendente', 'Suporte básico'])]
      );
      console.log('Plano padrão criado');
    }
    
  } catch (error) {
    console.error('Erro ao inserir dados iniciais:', error);
  }
}

module.exports = initDatabase;