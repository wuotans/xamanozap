const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const initDatabase = require('./config/initDatabase');
const authRoutes = require('./routes/authRoutes');
const { authMiddleware, adminMiddleware } = require('./middlewares/auth');
const db = require('./config/database');

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
    
    // Rotas protegidas
    app.get('/api/admin/organizations', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const [rows] = await db.query('SELECT * FROM organizations ORDER BY created_at DESC');
        res.json(rows);
      } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar organizações' });
      }
    });
    
    app.get('/api/admin/plans', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const [rows] = await db.query('SELECT * FROM plans ORDER BY price ASC');
        res.json(rows);
      } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos' });
      }
    });
    
    // Rota de teste
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date() });
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Frontend: http://localhost:5173`);
      console.log(`API: http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();