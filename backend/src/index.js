const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const initDatabase = require('./config/initDatabase');
const authRoutes = require('./routes/authRoutes');
const { authMiddleware, adminMiddleware } = require('./middlewares/auth');
const { getPool } = require('./config/database');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar banco de dados antes de iniciar o servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    
    // Rotas públicas
    app.use('/api/auth', authRoutes);
    
    // Rota de teste
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date() });
    });
    
    // ==================== ROTAS DE ORGANIZAÇÕES ====================
    
    // Listar organizações
    app.get('/api/organizations', authMiddleware, async (req, res) => {
      try {
        const db = await getPool();
        const [rows] = await db.query('SELECT * FROM organizations ORDER BY name');
        res.json(rows);
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
        res.status(500).json({ message: 'Erro ao buscar organizações' });
      }
    });
    
    // Criar organização (POST)
    app.post('/api/organizations', authMiddleware, async (req, res) => {
      try {
        const { name, slug, owner_email, phone, plan, status, max_users, max_connections, max_queues } = req.body;
        
        console.log('Recebendo requisição para criar organização:', { name, slug, owner_email });
        
        if (!name) {
          return res.status(400).json({ message: 'Nome é obrigatório' });
        }
        
        const db = await getPool();
        
        const [result] = await db.query(
          `INSERT INTO organizations (name, slug, phone, plan, status, max_users, max_connections, max_queues) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, slug || null, phone || null, plan || 'free', status || 'active', max_users || 3, max_connections || 1, max_queues || 3]
        );
        
        console.log('Organização criada com ID:', result.insertId);
        
        res.status(201).json({
          id: result.insertId,
          name,
          slug,
          phone,
          plan,
          status,
          max_users,
          max_connections,
          max_queues
        });
      } catch (error) {
        console.error('Erro ao criar organização:', error);
        res.status(500).json({ message: 'Erro ao criar organização', error: error.message });
      }
    });
    
    // ==================== ROTAS DE MEMBROS ====================
    
    // Criar membro
    app.post('/api/members', authMiddleware, async (req, res) => {
      try {
        const { organization_id, user_email, user_name, role, status, queues } = req.body;
        
        console.log('Criando membro:', { organization_id, user_email, user_name, role });
        
        const db = await getPool();
        
        const [result] = await db.query(
          `INSERT INTO members (organization_id, user_email, user_name, role, status, queues) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [organization_id, user_email, user_name, role || 'member', status || 'active', JSON.stringify(queues || [])]
        );
        
        res.status(201).json({
          id: result.insertId,
          organization_id,
          user_email,
          user_name,
          role,
          status
        });
      } catch (error) {
        console.error('Erro ao criar membro:', error);
        res.status(500).json({ message: 'Erro ao criar membro' });
      }
    });
    
    // Listar membros de uma organização
    app.get('/api/members/:organizationId', authMiddleware, async (req, res) => {
      try {
        const { organizationId } = req.params;
        const db = await getPool();
        const [rows] = await db.query('SELECT * FROM members WHERE organization_id = ?', [organizationId]);
        res.json(rows);
      } catch (error) {
        console.error('Erro ao buscar membros:', error);
        res.status(500).json({ message: 'Erro ao buscar membros' });
      }
    });
    
    // ==================== ROTAS DE USUÁRIOS ====================
    
    // Atualizar usuário
    app.put('/api/users/:id', authMiddleware, async (req, res) => {
      try {
        const { id } = req.params;
        const { organization_id } = req.body;
        
        console.log('Atualizando usuário:', { id, organization_id });
        
        const db = await getPool();
        
        await db.query(
          'UPDATE users SET organization_id = ? WHERE id = ?',
          [organization_id, id]
        );
        
        res.json({ message: 'Usuário atualizado com sucesso' });
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro ao atualizar usuário' });
      }
    });
    
    // ==================== ROTAS ADMINISTRATIVAS ====================
    
    // Listar organizações (admin)
    app.get('/api/admin/organizations', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const db = await getPool();
        const [rows] = await db.query('SELECT * FROM organizations ORDER BY created_at DESC');
        res.json(rows);
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
        res.status(500).json({ message: 'Erro ao buscar organizações' });
      }
    });
    
    // Listar planos (admin)
    app.get('/api/admin/plans', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const db = await getPool();
        const [rows] = await db.query('SELECT * FROM plans ORDER BY price ASC');
        res.json(rows);
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
        res.status(500).json({ message: 'Erro ao buscar planos' });
      }
    });
    
    // Criar plano (admin)
    app.post('/api/admin/plans', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const { name, price, features } = req.body;
        
        if (!name) {
          return res.status(400).json({ message: 'Nome é obrigatório' });
        }
        
        const db = await getPool();
        
        const [result] = await db.query(
          'INSERT INTO plans (name, price, features) VALUES (?, ?, ?)',
          [name, price || null, JSON.stringify(features || [])]
        );
        
        res.status(201).json({
          id: result.insertId,
          name,
          price,
          features
        });
      } catch (error) {
        console.error('Erro ao criar plano:', error);
        res.status(500).json({ message: 'Erro ao criar plano' });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`\n Servidor rodando na porta ${PORT}`);
      console.log(`   Frontend: http://localhost:5173`);
      console.log(`   API: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Rotas disponíveis:`);
      console.log(`   POST /api/organizations - Criar organização`);
      console.log(`   GET  /api/organizations - Listar organizações`);
      console.log(`   POST /api/members       - Criar membro`);
      console.log(`   PUT  /api/users/:id     - Atualizar usuário\n`);
    });
    
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();