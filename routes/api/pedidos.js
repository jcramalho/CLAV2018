var Auth = require('../../controllers/auth.js');
var Pedidos = require('../../controllers/api/pedidos');
var express = require('express');
var router = express.Router();

var validKeys = ["criadoPor", "codigo", "tipo", "acao"];
const { validationResult } = require('express-validator');
const { existe, estaEm, verificaPedidoCodigo, verificaExisteEnt, eMongoId } = require('../validation')

var tipos = [
    "Classe",
    "TS Organizacional",
    "TS Pluriorganizacional",
    "TS Pluriorganizacional web",
    "Entidade",
    "Tipologia",
    "Legislação",
    "Termo de Indice",
    "Auto de Eliminação",
    "AE PGD/LC",
    "AE PGD",
    "AE RADA",
    "RADA"
]
var acoes = ["Criação", "Alteração", "Remoção", "Importação", "Extinção"]
var estados = ["Submetido", "Distribuído", "Apreciado", "Validado", "Devolvido"]

// Lista todos os pedidos que statisfazem uma condição
router.get('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    existe('query', 'criadoPor')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .optional(),
    verificaPedidoCodigo('query', 'codigo').optional(),
    estaEm('query', 'tipo', tipos).optional(),
    estaEm('query', 'acao', acoes).optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var filtro = {}
    const entries = Object.entries(req.query)
        .filter(([k, v]) => validKeys.includes(k))

    for (var [key, value] of entries) {
        if(key == "tipo" || key == "acao") key = "objeto." + key
        filtro[key] = value
    }
    
    Pedidos.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pedidos: ${erro}`));
});

// Consulta de um pedido
router.get('/:codigo', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    verificaPedidoCodigo('param', 'codigo')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pedidos.consultar(req.params.codigo)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta do pedido: ${erro}`));
});

// Criação de um pedido
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    existe('body', 'user'),
    existe('body', 'user.email')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'novoObjeto'),
    existe('body', 'objetoOriginal').optional(),
    estaEm('body', 'tipoObjeto', tipos),
    estaEm('body', 'tipoPedido', acoes),
    verificaExisteEnt('body', 'entidade')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pedidos.criar(req.body)
        .then(dados => {
            res.jsonp(dados);
        })
        .catch(erro => res.status(500).send(`Erro na criação do pedido: ${erro}`));
})

// Atualização de um pedido: mais uma etapa na distribuição
router.put('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    existe('body', 'pedido'),
    eMongoId('body', 'pedido._id'),
    verificaPedidoCodigo('body', 'pedido.codigo'),
    estaEm('body', 'pedido.estado', estados),
    existe('body', 'pedido.data')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida"),
    existe('body', 'pedido.criadoPor')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'pedido.objeto'),
    existe('body', 'pedido.objeto.codigo').optional(),
    existe('body', 'pedido.objeto.dados').optional(),
    estaEm('body', 'pedido.objeto.tipo', tipos),
    estaEm('body', 'pedido.objeto.acao', acoes),
    existe('body', 'distribuicao'),
    estaEm('body', 'distribuicao.estado', estados),
    existe('body', 'distribuicao.responsavel')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .optional(),
    existe('body', 'distribuicao.data')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida"),
    existe('body', 'distribuicao.despacho').optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pedidos.atualizar(req.body.pedido._id, req.body)
        .then(dados => {
            res.jsonp(dados);
        })
        .catch(erro => res.status(500).send(`Erro na atualização do pedido: ${erro}`));
})

// Adição de distribuição 
router.post('/:codigo/distribuicao', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    verificaPedidoCodigo('param', 'codigo'),
    estaEm('body', 'estado', estados),
    existe('body', 'responsavel')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .optional(),
    existe('body', 'data')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida"),
    existe('body', 'despacho').optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pedidos.adicionarDistribuicao(req.params.codigo, req.body)
        .then(dados => dados ? res.jsonp(dados.codigo) : res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`))
        .catch(erro => res.status(500).send(`Erro na distribuição do pedido: ${erro}`));
});

module.exports = router;
