var Auth = require('../../controllers/auth.js');
var Pedidos = require('../../controllers/api/pedidos');
var express = require('express');
var router = express.Router();

var validKeys = ["criadoPor", "codigo", "tipo", "acao"];
const { body, validationResult } = require('express-validator');
const { existe, estaEm, verificaPedidoCodigo, verificaExisteEnt, eMongoId, vcPedidoTipo, vcPedidoAcao, vcPedidoEstado, verificaLista } = require('../validation')

// Lista todos os pedidos que satisfazem uma condição
router.get('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), [
    existe('query', 'criadoPor')
        .bail()
        .isEmail()
        .withMessage("Email inválido")
        .optional(),
    verificaPedidoCodigo('query', 'codigo').optional(),
    estaEm('query', 'tipo', vcPedidoTipo).optional(),
    estaEm('query', 'acao', vcPedidoAcao).optional()
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

    //se o nivel de utilizador é < 3.5 então devolve apenas os pedidos da sua entidade
    if(req.user.level < 3.5){
        filtro["entidade"] = req.user.entidade
    }
    
    Pedidos.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pedidos: ${erro}`));
});

// Lista todos os pedidos que satisfazem uma condição mas apenas a sua metainformação
router.get('/meta', (req, res) => {
    Pedidos.listarMeta()
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
        .then(dados => {
            if(dados){
                //se o nivel de utilizador é < 3.5 então devolve apenas os pedidos da sua entidade
                if(req.user.level < 3.5 && req.user.entidade != dados.entidade){
                    res.status(403).send("Não tem permissões para aceder este pedido")
                }else{
                    res.jsonp(dados)
                }
            }else{
                res.status(404).send(`Erro. O pedido '${req.params.codigo}' não existe`)
            }
        })
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
    estaEm('body', 'tipoObjeto', vcPedidoTipo),
    estaEm('body', 'tipoPedido', vcPedidoAcao),
    verificaExisteEnt('body', 'entidade'),
    verificaLista('body', 'historico'),
    body('despacho').customSanitizer(v => {
        return !!v ? v : "Submissão inicial"
    })
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
router.put('/', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
    existe('body', 'pedido'),
    eMongoId('body', 'pedido._id'),
    verificaPedidoCodigo('body', 'pedido.codigo'),
    estaEm('body', 'pedido.estado', vcPedidoEstado),
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
    estaEm('body', 'pedido.objeto.tipo', vcPedidoTipo),
    estaEm('body', 'pedido.objeto.acao', vcPedidoAcao),
    existe('body', 'distribuicao'),
    estaEm('body', 'distribuicao.estado', vcPedidoEstado),
    existe('body', 'distribuicao.responsavel')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'distribuicao.data')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida"),
    existe('body', 'distribuicao.proximoResponsavel.nome', existe('body', 'distribuicao.proximoResponsavel')),
    verificaExisteEnt('body', 'distribuicao.proximoResponsavel.entidade', existe('body', 'distribuicao.proximoResponsavel')),
     existe('body', 'distribuicao.proximoResponsavel.email', existe('body', 'distribuicao.proximoResponsavel'))
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'distribuicao.despacho').optional()
], (req, res) => {
    const errors = validationResult(req)
    console.log(errors)
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
router.post('/:codigo/distribuicao', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
    verificaPedidoCodigo('param', 'codigo'),
    estaEm('body', 'estado', vcPedidoEstado),
    existe('body', 'responsavel')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'data')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida"),
    existe('body', 'proximoResponsavel.nome', existe('body', 'proximoResponsavel')),
    verificaExisteEnt('body', 'proximoResponsavel.entidade', existe('body', 'proximoResponsavel')),
    existe('body', 'proximoResponsavel.email', existe('body', 'proximoResponsavel'))
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
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

// Apaga todos pedidos
router.delete('/', Auth.isLoggedInUser, Auth.checkLevel(7), (req, res) => {
    Pedidos.apagarTodos()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de todos os pedidos: ${erro}`));
})

module.exports = router;
