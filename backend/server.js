const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 8080;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());

// Status
app.get('/api/status', (req, res) => {
  res.json({ status: 'API Node.js rodando perfeitamente!' });
});

// Login unificado buscando direto no Banco de Dados (Tabela usuarios e oficinas)
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    const emailLimpo = email ? email.trim().toLowerCase() : '';

    // 1. Tenta buscar na tabela de usuários (Administradores do Sistema)
    const resultUsuario = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1 LIMIT 1', [emailLimpo]);
    let usuarioEncontrado = resultUsuario.rows[0];

    if (usuarioEncontrado) {
      if (usuarioEncontrado.ativo === false) {
        return res.status(401).json({ error: 'Usuário desativado.' });
      }
      if (!usuarioEncontrado.senha || usuarioEncontrado.senha !== senha) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      return res.json({
        accessToken: 'fake-jwt-token-estudo',
        token: 'fake-jwt-token-estudo',
        user: {
          id: usuarioEncontrado.id,
          email: usuarioEncontrado.email,
          nome: usuarioEncontrado.nome || 'Administrador',
          perfil: usuarioEncontrado.perfil || 'ADM_SISTEMA'
        },
        usuario: {
          id: usuarioEncontrado.id,
          email: usuarioEncontrado.email,
          nome: usuarioEncontrado.nome || 'Administrador',
          perfil: usuarioEncontrado.perfil || 'ADM_SISTEMA'
        }
      });
    }

    // 2. Se não achou na tabela usuarios, busca na tabela de oficinas
    const resultOficina = await pool.query('SELECT * FROM oficinas WHERE LOWER(email) = $1 LIMIT 1', [emailLimpo]);
    let oficinaEncontrada = resultOficina.rows[0];

    if (!oficinaEncontrada) {
      return res.status(401).json({ error: 'E-mail não cadastrado.' });
    }

    if (!oficinaEncontrada.senha || oficinaEncontrada.senha !== senha) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    res.json({
      accessToken: 'fake-jwt-token-estudo',
      token: 'fake-jwt-token-estudo',
      user: {
        id: oficinaEncontrada.id,
        email: oficinaEncontrada.email,
        nome: oficinaEncontrada.nome,
        perfil: 'ADM_OFICINA'
      },
      usuario: {
        id: oficinaEncontrada.id,
        email: oficinaEncontrada.email,
        nome: oficinaEncontrada.nome,
        perfil: 'ADM_OFICINA'
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao realizar login no banco de dados.' });
  }
});

// --- ROTAS DE OFICINAS ---
app.get('/api/oficinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM oficinas ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar oficinas:', error);
    res.status(500).json({ error: 'Erro ao buscar oficinas no banco de dados.' });
  }
});

app.post('/api/oficinas', async (req, res) => {
  const { nome, cnpj, telefone, endereco, email, emailAdministrador, senha } = req.body;
  
  try {
    const slug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const query = `
      INSERT INTO oficinas (nome, cnpj, telefone, email, endereco, senha, slug, ativo) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, false) 
      RETURNING *;
    `;
    
    const emailFinal = email || emailAdministrador;
    const values = [nome, cnpj, telefone, emailFinal, endereco, senha, slug];
    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Oficina cadastrada com sucesso!',
      oficina: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao cadastrar oficina:', error);
    res.status(500).json({ error: 'Erro ao cadastrar oficina no banco de dados.' });
  }
});

app.put('/api/oficinas/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, telefone, endereco, email, senha } = req.body;

  try {
    const slug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    let query = '';
    let values = [];

    if (senha && senha.trim() !== '') {
      query = `
        UPDATE oficinas 
        SET nome = $1, cnpj = $2, telefone = $3, endereco = $4, email = $5, senha = $6, slug = $7
        WHERE id = $8 
        RETURNING *;
      `;
      values = [nome, cnpj, telefone, endereco, email, senha.trim(), slug, id];
    } else {
      query = `
        UPDATE oficinas 
        SET nome = $1, cnpj = $2, telefone = $3, endereco = $4, email = $5, slug = $6
        WHERE id = $7 
        RETURNING *;
      `;
      values = [nome, cnpj, telefone, endereco, email, slug, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Oficina não encontrada.' });
    }

    res.json({
      message: 'Oficina atualizada com sucesso!',
      oficina: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar oficina:', error);
    res.status(500).json({ error: 'Erro ao atualizar oficina no banco de dados.' });
  }
});

app.patch('/api/oficinas/:id/ativacao', async (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;

  try {
    const query = `
      UPDATE oficinas 
      SET ativo = $1 
      WHERE id = $2 
      RETURNING *;
    `;
    const values = [ativo, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Oficina não encontrada.' });
    }

    res.json({
      message: 'Status da oficina atualizado com sucesso!',
      oficina: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao alterar status da oficina:', error);
    res.status(500).json({ error: 'Erro ao atualizar status no banco de dados.' });
  }
});

// --- ROTAS DE CLIENTES (Isoladas por Oficina) ---
app.get('/api/clientes', async (req, res) => {
  const { oficinaId } = req.query;
  try {
    let query = `
      SELECT DISTINCT c.* FROM clientes c
      JOIN clientes_oficinas co ON c.id = co.cliente_id
    `;
    let values = [];

    if (oficinaId) {
      query += ` WHERE co.oficina_id = $1`;
      values.push(oficinaId);
    }

    query += ` ORDER BY c.id DESC`;
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes no banco de dados.' });
  }
});

app.post('/api/clientes', async (req, res) => {
  const { nome, telefone, email, placa, placaCarro, placa_carro, modeloVeiculo, modelo_veiculo, cidade, estado, cpf, oficinaId } = req.body;
  
  const placaBruta = placa || placaCarro || placa_carro || '';
  const placaFinal = placaBruta.trim() ? placaBruta.toUpperCase() : null;
  const modeloFinal = modeloVeiculo || modelo_veiculo || null;
  const cpfFinal = cpf || null;

  try {
    const queryCliente = `
      INSERT INTO clientes (nome, telefone, email, placa_carro, modelo_veiculo, cidade, estado, cpf) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *;
    `;
    const valuesCliente = [nome, telefone, email, placaFinal, modeloFinal, cidade, estado, cpfFinal];
    const resultCliente = await pool.query(queryCliente, valuesCliente);
    const novoCliente = resultCliente.rows[0];

    let idOficinaVinculo = oficinaId;
    if (!idOficinaVinculo) {
      const oficinaPadrao = await pool.query('SELECT id FROM oficinas LIMIT 1');
      if (oficinaPadrao.rows.length > 0) {
        idOficinaVinculo = oficinaPadrao.rows[0].id;
      }
    }

    if (idOficinaVinculo) {
      await pool.query(
        `INSERT INTO clientes_oficinas (cliente_id, oficina_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [novoCliente.id, idOficinaVinculo]
      );
    }

    res.status(201).json({
      message: 'Cliente cadastrado com sucesso!',
      cliente: novoCliente
    });
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    res.status(500).json({ error: 'Erro ao cadastrar cliente no banco de dados.' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clientes_oficinas WHERE cliente_id = $1', [id]);
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *;', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json({ message: 'Cliente excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ error: 'Erro ao excluir cliente no banco de dados.' });
  }
});

// --- ROTA DE BUSCA DE CLIENTE POR PLACA ---
app.get('/api/clientes/placa/:placa', async (req, res) => {
  const { placa } = req.params;
  const { oficinaId } = req.query;

  try {
    let query = `
      SELECT c.* FROM clientes c
      JOIN clientes_oficinas co ON c.id = co.cliente_id
      WHERE UPPER(c.placa_carro) = UPPER($1)
    `;
    let values = [placa.trim()];

    if (oficinaId) {
      query += ` AND co.oficina_id = $2`;
      values.push(oficinaId);
    }

    query += ` LIMIT 1`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo/Cliente não encontrado para esta placa.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cliente por placa:', error);
    res.status(500).json({ error: 'Erro ao buscar veículo no banco de dados.' });
  }
});

// --- ROTAS DE ORDENS DE SERVIÇO (Isoladas por Oficina) ---
app.get('/api/ordens', async (req, res) => {
  const { oficinaId } = req.query;
  try {
    let query = 'SELECT * FROM ordens_servico';
    let values = [];

    if (oficinaId) {
      query += ' WHERE oficina_id = $1';
      values.push(oficinaId);
    } else {
      query += ' WHERE oficina_id IS NOT NULL';
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar ordens:', error);
    res.status(500).json({ error: 'Erro ao buscar ordens de serviço.' });
  }
});

app.post('/api/ordens', async (req, res) => {
  const { modelo, placa, cliente, telefone, problema, status, valorTotal, oficinaId } = req.body;
  const valorFinal = valorTotal || 0;

  try {
    let idOficinaVinculo = oficinaId;
    if (!idOficinaVinculo) {
      const oficinaPadrao = await pool.query('SELECT id FROM oficinas LIMIT 1');
      if (oficinaPadrao.rows.length > 0) {
        idOficinaVinculo = oficinaPadrao.rows[0].id;
      }
    }

    const query = `
      INSERT INTO ordens_servico (modelo, placa, cliente, telefone, problema, status, valor_total, oficina_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *;
    `;
    const values = [modelo, placa, cliente, telefone, problema, status, valorFinal, idOficinaVinculo];
    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Ordem de serviço criada com sucesso!',
      ordem: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar ordem:', error);
    res.status(500).json({ error: 'Erro ao criar ordem de serviço no banco de dados.' });
  }
});

app.patch('/api/ordens/:id/finalizar', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE ordens_servico 
      SET status = 'FINALIZADA' 
      WHERE id = $1 
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    res.json({ message: 'Ordem de serviço finalizada com sucesso!', ordem: result.rows[0] });
  } catch (error) {
    console.error('Erro ao finalizar ordem:', error);
    res.status(500).json({ error: 'Erro ao finalizar ordem no banco de dados.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});