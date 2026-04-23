const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Tentativa de login:', { email }); // Log para debug
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }
    
    const db = await getPool();
    
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    console.log('Usuário encontrado:', users.length > 0 ? 'Sim' : 'Não');
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    console.log('Senha válida:', validPassword);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro detalhado no login:', error);
    res.status(500).json({ 
      message: 'Erro no servidor', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
};

exports.getMe = async (req, res) => {
  try {
    const db = await getPool();
    const [users] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Erro no getMe:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};