const express = require('express');
const path = require('node:path');
const router = express.Router();
const pool = require('./db');
const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');
const upload = require('./file-upload');
const cryptr = new Cryptr('myTotallySecretKey');
const JWT_SECRET = 'your_jwt_secret';
const fs = require('fs');
let invalidTokens = [];

const limit = 10;

// Utilitário para enviar respostas de erro
const errorResponse = (res, status, message, details = null) => 
    res.status(status).json({ message, ...(details && { details }) });

// Middleware para autenticar token JWT
const autenticarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token || invalidTokens.includes(token)) {
        return errorResponse(res, 403, 'Token inválido ou não fornecido.');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return errorResponse(res, 403, 'Token inválido.');
        req.user = decoded;
        next();
    });
};

// Middlewares para verificar tipo de usuário admin
const verificarAdmin = (req, res, next) => {
    if (req.user.tipo !== 'admin') {
        return errorResponse(res, 403, 'Acesso restrito a administradores.');
    }
    next();
};

// Middlewares para verificar tipo de usuário clt
const verificarClt = (req, res, next) => {
    if (req.user.tipo !== 'CLT') {
        return errorResponse(res, 403, 'Acesso restrito a CLTs.');
    }
    next();
};

// Middlewares para verificar tipo de usuário pj
const verificarPj = (req, res, next) => {
    if (req.user.tipo !== 'PJ') {
        return errorResponse(res, 403, 'Acesso restrito a PJs.');
    }
    next();
};

//<><><> Rotas Dev

// Rota: Cadastrar usuário
router.post('/dev/user', async (req, res) => {
    const { cpf, email, senha, tipo, nome} = req.body;

    if (!cpf || !email || !senha || !tipo) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        const senhaCriptografada = cryptr.encrypt(senha);
        await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5    )', [cpf, email, senhaCriptografada, tipo, nome]);
        res.status(200).json({ message: 'Usuário cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar usuário.', error.message);
    }
});

//<><><> Rotas usuário

// Rota: Desautenticar usuário
router.post('/user/desautenticar', autenticarToken, (req, res) => {
    invalidTokens.push(req.headers['authorization']);
    res.json({ message: 'Usuário desautenticado com sucesso.' });
});

// Rota: Autenticar usuário por cpf
router.post('/user/autenticar', async (req, res) => {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return errorResponse(res, 400, 'CPF e senha são obrigatórios.');
    }

    try {
        const { rows } = await pool.query('SELECT * FROM usuario WHERE cpf = $1', [cpf]);
        if (!rows.length || cryptr.decrypt(rows[0].senha) !== senha) {
            return errorResponse(res, 401, 'Credenciais inválidas.');
        }

        const token = jwt.sign({ cpf_usuario: rows[0].cpf, tipo: rows[0].tipo }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({
            message: 'Autenticado com sucesso.',
            token,
            tipo: rows[0].tipo
        });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao autenticar usuário.', error.message);
    }
});

// Rota: Autenticar usuário por email
router.post('/user/autenticaremail', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return errorResponse(res, 400, 'E-mail e senha são obrigatórios.');
    }

    try {
        const { rows } = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
        if (!rows.length || cryptr.decrypt(rows[0].senha) !== senha) {
            return errorResponse(res, 401, 'Credenciais inválidas.');
        }

        const token = jwt.sign({ cpf: rows[0].cpf, tipo: rows[0].tipo }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({
            message: 'Autenticado com sucesso.',
            token,
            tipo: rows[0].tipo
        });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao autenticar usuário.', error.message);
    }
});

// Rota: Testar autenticação
router.get('/user/testar-autenticacao', autenticarToken, (req, res) => {
    res.json({ message: 'Autenticação válida.', user: req.user });
});

//<><><> Rotas administrador

// Rotas: Testar autenticação para CLT
router.get('/clt/testar-autenticacao', autenticarToken, verificarClt, (req, res) => {
    res.json({ message: 'Autenticação válida para CLT.', user: req.user });
});


//<><><> Rotas PJ

// Rotas: Testar autenticação para PJ
router.get('/pj/testar-autenticacao', autenticarToken, verificarPj, (req, res) => {
    res.json({ message: 'Autenticação válida para PJ.', user: req.user });
});


// Rota: Listar holerites com filtro

router.get('/admin/holerite', autenticarToken, verificarAdmin, async (req, res) => {
    const { mes, ano, cpf_usuario } = req.query;

    let query = 'SELECT mes, ano, cpf_usuario, caminho_documento FROM holerite';
    const params = [];
    const conditions = [];

    if (mes) {
        conditions.push('mes = $' + (params.length + 1));
        params.push(mes);
    }
    if (ano) {
        conditions.push('ano = $' + (params.length + 1));
        params.push(ano);
    }
    if (cpf_usuario) {
        conditions.push('cpf_usuario = $' + (params.length + 1));
        params.push(cpf_usuario);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao listar holerites.', error.message);
    }
});

// Rota: Alterar holerite

router.put('/admin/holerite/', autenticarToken, verificarAdmin, upload.single('file'), async (req, res) => {
    const { cpf_usuario, mes, ano } = req.body;

    if (!mes || !ano || !cpf_usuario) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios');
    }

    if(mes > 12 || mes < 1){
        return errorResponse(res, 400, 'O mes deve ser menor que 12 e maior que 1');
    }

    if(ano > 2100 || ano < 1960){
        return errorResponse(res, 400, 'O ano deve ser acima de 1960 e menor que 2100')
    }
 
    if(!req.file){
        return res.status(413).json({error: 'Nao enviou o arquivo'});
    }

    try {
        await pool.query('BEGIN');

        const result = await pool.query(
            'DELETE FROM holerite WHERE mes = $1 AND ano = $2 AND cpf_usuario = $3 RETURNING *', 
            [mes, ano, cpf_usuario]
        );

        if (result.rowCount === 0) {
        fs.unlink(path.join('uploads/', req.file.filename), (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Erro ao excluir arquivo temporário:', err);
            }
        });

            return errorResponse(res, 404, 'Holerite não encontrado.');
        }

        const deletar = await pool.query(
        'DELETE FROM documento WHERE caminho = $1 RETURNING *',
        [result.rows[0].caminho_documento]);

        const insert = await pool.query(
        'INSERT INTO documento (nome, cpf_usuario) values ($1,$2) RETURNING *', [req.file.filename, cpf_usuario]);

        await pool.query(
        'INSERT INTO holerite (mes, ano, cpf_usuario, caminho_documento) VALUES ($1, $2, $3, $4)',
        [mes, ano, cpf_usuario, insert.rows[0].caminho]);

        await pool.query('COMMIT');

        fs.unlink(path.join('uploads/', deletar.rows[0].nome), (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Erro ao excluir arquivo temporário:', err);
            }
        });

        return res.status(200).json({ message: 'Holerite atualizado com sucesso.' });
    } catch (error) {

        await pool.query('ROLLBACK');

        fs.unlink(path.join('uploads/', req.file.filename), (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Erro ao excluir arquivo temporário:', err);
            }
        });
        errorResponse(res, 500, 'Erro ao atualizar holerite.', error.message);
    }
});


//CADASTRAR NOTAFISCAL
router.post('/pj/notafiscal', autenticarToken, verificarPj, upload.single('file'), async (req, res) => {
    const { mes, ano } = req.body;
    const { cpf_usuario } = req.user;

    if (!mes || !ano || !cpf_usuario) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios');
    }

    if(mes > 12 || mes < 1){
        return errorResponse(res, 400, 'O mes deve ser menor que 12 e maior que 1');
    }

    if(ano > 2100 || ano < 1960){
        return errorResponse(res, 400, 'O ano deve ser acima de 1960 e menor que 2100')
    }
 
    if(!req.file){
        return res.status(413).json({error: 'Nao enviou o arquivo'});
    }

    try {
        await pool.query('BEGIN');
        const result = await pool.query(
            'INSERT INTO documento (nome, cpf_usuario) VALUES ($1, $2) RETURNING *', 
            [req.file.filename, cpf_usuario]
        );

        await pool.query(
            'INSERT INTO nota_fiscal (mes, ano, cpf_usuario, caminho_documento) VALUES ($1, $2, $3, $4)', 
            [mes, ano, cpf_usuario, result.rows[0].caminho]
        );

        await pool.query('COMMIT');

        return res.status(200).json({ message: 'Nota fiscal cadastrado com sucesso.' });

    } catch (error) {
        await pool.query('ROLLBACK');

        fs.unlink(path.join('uploads/', req.file.filename), (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Erro ao excluir arquivo temporário:', err);
            }
        });

        return errorResponse(res, 500, 'Erro ao cadastrar nota fiscal.', error.message);
    }
});

// Rota: Cadastrar holerite
router.post('/admin/holerite', autenticarToken, verificarAdmin, upload.single('file'), async (req, res) => {
    const { mes, ano, cpf_usuario } = req.body;
    let caminho;
    if (!mes || !ano || !cpf_usuario) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    if(mes > 12 || mes < 1){
        return errorResponse(res, 400, 'O mes deve ser menor que 12 e maior que 1');
    }

    if(ano > 2100 || ano < 1960){
        return errorResponse(res, 400, 'O ano deve ser acima de 1960 e menor que 2100')
    }

    if(!req.file){
        return res.status(413).json({error: 'File not uploaded'});
    }

    try {
        await pool.query('BEGIN');
        const result = await pool.query(
            'INSERT into documento (nome, cpf_usuario) values  ($1, $2) RETURNING *', 
        [req.file.filename, cpf_usuario]);

        await pool.query(
            'INSERT INTO holerite (mes, ano, cpf_usuario, caminho_documento) VALUES ($1, $2, $3, $4)', 
            [mes, ano, cpf_usuario, result.rows[0].caminho]);

        await pool.query('COMMIT');

        res.status(200).json({ message: 'Holerite cadastrado com sucesso.' });
    } catch (error) {
        await pool.query('ROLLBACK');

        fs.unlink(path.join('uploads/', req.file.filename), (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Erro ao excluir arquivo temporário:', err);
            }
        });

        errorResponse(res, 500, 'Erro ao cadastrar holerite.', error.message);
    }
});

// Rota: Remover holerite
router.delete('/admin/holerite/:cpf_usuario/:mes/:ano', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf_usuario, mes, ano } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM holerite WHERE cpf_usuario = $1 AND mes = $2 AND ano = $3 RETURNING *', 
            [cpf_usuario, mes, ano]
        );
        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'Holerite não encontrado.');
        }

        if(result.rows[0].caminho_documento){
            const caminho = await pool.query(
                'DELETE FROM documento WHERE caminho = $1 RETURNING *', [result.rows[0].caminho_documento]
            );

            fs.unlink(path.join('uploads/', caminho.rows[0].nome), (err) => {
                if (err && err.code !== 'ENOENT') {  // Ignore "file not found" errors
                    console.error('Erro ao excluir o arquivo:', err);
                }
            });
        }

        res.status(200).json({ message: 'Holerite removido com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao remover holerite.', error.message);
    }
});


// Rotas: Testar autenticação para administrador
router.get('/admin/testar-autenticacao', autenticarToken, verificarAdmin, (req, res) => {
    res.json({ message: 'Autenticação válida para administrador.', user: req.user });
});

// Rota: Cadastrar usuário
router.post('/admin/user', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf, email, senha, nome, tipo } = req.body;

    
    if (!cpf || !email || !senha || !tipo) {
        return errorResponse(res, 400, 'Todos os campos são obrigatórios.');
    }

    try {
        const senhaCriptografada = cryptr.encrypt(senha);
        await pool.query('INSERT INTO usuario (cpf, email, senha, tipo, nome) VALUES ($1, $2, $3, $4, $5)', [cpf, email, senhaCriptografada, tipo, nome]);
        res.status(200).json({ message: 'Usuário cadastrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao cadastrar usuário.', error.message);
    }
});

// Rota: Listar usuários com pesquisa e paginação
router.post('/admin/user/list', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf_nome, pagina } = req.body;

    let query = `SELECT cpf, email, tipo, nome FROM usuario LIMIT $1 OFFSET $2`;
    let params = [limit, pagina * limit];

    if (cpf_nome) {
        const regex = /^[0-9.\-]+$/;
        if(regex.test(cpf_nome)){
            query = `SELECT cpf, email, tipo, nome FROM usuario WHERE cpf ILIKE $3 LIMIT $1 OFFSET $2`;
            params = [limit, pagina * limit, `%${cpf_nome}%`];
        }else{
            query = `SELECT cpf, email, tipo, nome FROM usuario WHERE nome ILIKE $3 LIMIT $1 OFFSET $2`;
            params = [limit, pagina * limit, `%${cpf_nome}%`];
        }
    }

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao listar usuários.', error.message);
    }
});

// Rota: Listar usuários com filtro
router.get('/admin/user', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf, email, tipo, nome } = req.query;

    let query = 'SELECT cpf, email, tipo, nome FROM usuario';
    const params = [];
    const conditions = [];

    if (cpf) {
        conditions.push('cpf = $' + (params.length + 1));
        params.push(cpf);
    }
    if(nome){
        conditions.push('nome = $' + (params.length + 1));
        params.push(`%${nome}%`);
    }
    if (email) {
        conditions.push('email ILIKE $' + (params.length + 1));
        params.push(`%${email}%`);
    }
    if (tipo) {
        conditions.push('tipo = $' + (params.length + 1));
        params.push(tipo);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao listar usuários.', error.message);
    }
});

// Rota: Alterar usuário
router.put('/admin/user/:cpf', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf } = req.params;
    const { email, nome, tipo } = req.body;

    if (!email && !nome && !tipo) {
        return errorResponse(res, 400, 'Nenhum campo para atualizar foi enviado.');
    }

    const fields = [];
    const params = [];

    if (email) {
        fields.push('email = $' + (params.length + 1));
        params.push(email);
    }
    if(nome){
        fields.push('nome = $' + (params.length + 1));
        params.push(nome);
    }
    if (tipo) {
        fields.push('tipo = $' + (params.length + 1));
        params.push(tipo);
    }

    params.push(cpf);
    const query = `UPDATE usuario SET ${fields.join(', ')} WHERE cpf = $${params.length}`;

    try {
        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'Usuário não encontrado.');
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao atualizar usuário.', error.message);
    }
});

// Rota: Remover usuário
router.delete('/admin/user/:cpf', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf } = req.params;

    try {
        const result = await pool.query('DELETE FROM usuario WHERE cpf = $1', [cpf]);
        if (result.rowCount === 0) {
            return errorResponse(res, 404, 'Usuário não encontrado.');
        }
        res.status(200).json({ message: 'Usuário removido com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao remover usuário.', error.message);
    }
});

//<><><> Rotas funcionários

//<><><> Rotas CLT

// Rota: Listar holerites com filtro
router.get('/clt/holerite', autenticarToken, verificarClt, async (req, res) => {
    const { mes, ano } = req.query;
    const { cpf_usuario } = req.user;

    let query = 'SELECT mes, ano, cpf_usuario, caminho_documento FROM holerite';
    const params = [];
    const conditions = [];

    if (mes) {
        conditions.push('mes = $' + (params.length + 1));
        params.push(mes);
    }
    if (ano) {
        conditions.push('ano = $' + (params.length + 1));
        params.push(ano);
    }
    if (cpf_usuario) {
        conditions.push('cpf_usuario = $' + (params.length + 1));
        params.push(cpf_usuario);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao listar holerites.', error.message);
    }
});
//<><><> Listar documentos

router.get('/arquivo/listar', autenticarToken, async (req, res) =>{
    const { cpf_usuario } = req.user;
    
    try{
        const result = await pool.query('SELECT * FROM documento WHERE cpf_usuario = $1', [cpf_usuario]);

        if(!result.rowCount === 0){
            return res.status(404).json({error: 'Nenhum arquivo encontrado'});
        }

        res.status(200).json(result.rows);

    } catch(error){
        return res.status(404).json({error: 'Erro ao buscar no banco de dados'});
    }
});

//<><><> Download de arquivo baseado no caminho
router.get("/arquivo/download/:caminho", autenticarToken, async (req, res) => {
    const { caminho } = req.params;
    const { cpf_usuario } = req.user; 

    try {
        const result = await pool.query("SELECT nome FROM documento WHERE cpf_usuario = $1 AND caminho = $2", [cpf_usuario, caminho]);


        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No file found for this user" });
        }

        const filename = result.rows[0].nome;
        const filePath = path.join(__dirname, "uploads", filename);

        res.download(filePath, filename, (err) => {
            if (err) {
                res.status(500).json({ error: "Error downloading file" });
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

router.post('/admin/clt/ponto', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf_usuario, entrada_saida, horario } = req.body;
    if (!cpf_usuario) {
        return errorResponse(res, 400, 'Cpf obrigatório');
    }

    try {
        const result = await pool.query('SELECT * FROM ponto WHERE cpf_usuario = $1 AND horario LIKE $2', [cpf_usuario, horario]);

        if(result.rows.lenght > 0){
            if(String(entrada_saida) === String(result.rows[0].entrada_saida)){
               return errorResponse(res, 500, 'Erro ao registrar ponto, não é possível entrar/sair mais de uma vez por dia');
            }
        }
        await pool.query('INSERT INTO ponto (horario, cpf_usuario, entrada_saida) VALUES (now(), $1, $2)', [cpf_usuario, entrada_saida]);
        res.status(200).json({ message: 'Ponto registrado com sucesso.' });
    } catch (error) {
        errorResponse(res, 500, 'Erro ao registrar ponto.', error.message); 
    }
});

//ROTA LISTAR DO USUARIO PELO ADM
router.get('/admin/clt/ponto', autenticarToken, verificarAdmin, async (req, res) => {
    const { cpf_usuario } = req.body;
    if (!cpf_usuario) {
        return errorResponse(res, 400, 'Cpf obrigatório');
    }
    try {
        const result = await pool.query('SELECT * FROM ponto WHERE cpf_usuario = $1', [cpf_usuario]);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao deletar ponto.', error.message); 
    }
});


//ROTA LISTAR DO USUARIO
router.get('/clt/ponto', autenticarToken, async (req, res) => {
    const { cpf_usuario } = req.user;
    if (!cpf_usuario) {
        return errorResponse(res, 400, 'Cpf obrigatório');
    }
    try {
        const result = await pool.query('SELECT * FROM ponto WHERE cpf_usuario = $1', [cpf_usuario]);
        res.status(200).json(result.rows);
    } catch (error) {
        errorResponse(res, 500, 'Erro ao deletar ponto.', error.message); 
    }
});





router.post('/clt/ponto', autenticarToken, async (req, res) => {
    const { entrada_saida } = req.body;
    const { cpf_usuario } = req.user;

    if (!cpf_usuario) {
        return errorResponse(res, 400, 'Cpf obrigatório');
    }

    try {
        
        const result = await pool.query(
            `SELECT entrada_saida FROM ponto 
            WHERE cpf_usuario = $1 
            AND ((horario AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::DATE = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE
            ORDER BY horario ASC`,
            [cpf_usuario]
        );

        console.log("Today's ponto entries:", result.rows); // Debug output

        const entradas = result.rows.filter(row => row.entrada_saida === true).length;
        const saidas = result.rows.filter(row => row.entrada_saida === false).length;

        // Prevent duplicate clock-ins or clock-outs.
        if (entrada_saida === true && entradas >= 1) {
            return errorResponse(res, 400, 'Erro ao registrar ponto, você já fez entrada hoje.');
        }
        if (entrada_saida === false && saidas >= 1) {
            return errorResponse(res, 400, 'Erro ao registrar ponto, você já fez saída hoje.');
        }
        if (entrada_saida === false && entradas === 0) {
            return errorResponse(res, 400, 'Erro ao registrar ponto, você não pode sair antes de entrar.');
        }

        await pool.query(
            "INSERT INTO ponto (horario, cpf_usuario, entrada_saida) VALUES (NOW() AT TIME ZONE 'UTC', $1, $2)",
            [cpf_usuario, entrada_saida]
        );

        res.status(200).json({ message: 'Ponto registrado com sucesso.' });

    } catch (error) {
        return errorResponse(res, 500, 'Erro ao registrar ponto.', error.message);
    }
});

module.exports = router;
