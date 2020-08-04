var Pendentes = require('../../controllers/api/pendentes');
var express = require('express');
var router = express.Router();

const { validationResult } = require('express-validator');
const { existe, estaEm, eMongoId, vcPendenteTipo, vcPendenteAcao } = require('../validation')

router.get('/', (req, res) => {
    let filtro = {}

    //se o nivel de utilizador é <3 então devolve apenas os pendentes do utilizador
    if(req.user.level < 3){
        filtro["criadoPor"] = req.user.email
    }

    Pendentes.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem de pendentes: ${erro}`));
});

router.get('/:id', [
    eMongoId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.consultar(req.params.id)
        .then(dados => {
            if(dados){
                //se o nivel de utilizador é <3 então devolve apenas os pendentes do utilizador
                if(req.user.level < 3 && req.user.email != dados.criadoPor){
                    res.status(403).send("Não tem permissões para aceder este pendente")
                }else{
                    res.jsonp(dados)
                }
            }else{
                res.status(404).send(`Erro. O pendente '${req.params.id}' não existe`)
            }
        })
        .catch(erro => res.status(500).send(`Erro ao recuperar trabalho pendente: ${erro}`));
})

// Guardar um trabalho pendente
router.post('/', [
    estaEm('body', 'tipo', vcPendenteTipo),
    estaEm('body', 'acao', vcPendenteAcao),
    existe('body', 'criadoPor')
        .bail()
        .isEmail()
        .withMessage("Email inválido"),
    existe('body', 'numInterv')
        .bail()
        .isInt({min: 0})
        .withMessage("Não é um número inteiro maior ou igual 0"),
    existe('body', 'dataCriacao')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida")
        .optional(),
    existe('body', 'dataAtualizacao')
        .bail()
        .isISO8601({strict: true})
        .withMessage("A data é inválida")
        .optional(),
    existe('body', 'objeto')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.criar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao guardar trabalho pendente: ${erro}`));
})

// Atualizar um trabalho previamente guardado como pendente: UPDATE
router.put('/', [
    eMongoId('body', '_id'),
    existe('body', 'objeto'),
    existe('body', 'numInterv')
        .bail()
        .isInt({min: 0})
        .withMessage("Não é um número inteiro maior ou igual 0")
        .optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.atualizar(req.body)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao atualizar trabalho pendente: ${erro}`));
})

// Apaga um trabalho pendente
router.delete('/:id', [
    eMongoId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Pendentes.apagar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de um trabalho pendente ' ${req.params.id}': ${erro}`));
})

// Apaga todos trabalhos pendentes
router.delete('/', (req, res) => {
    Pendentes.apagarTodos()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de todos os trabalhos pendentes: ${erro}`));
})

module.exports = router;
