var Invariantes = require('../../controllers/api/invariantes.js');
const { validationResult } = require('express-validator');
const { comecaPorEMatch, existeDep } = require('../validation')

var express = require('express');
var router = express.Router();

function verificaId(location, field, fieldDep){
    if(field == "idRel"){
        starts = 'rel_'
        regex = /^rel_\d+$/
    }else{
        starts = 'inv_'
        regex = /^inv_\d+(_\d+)?$/
    }
    return comecaPorEMatch(location, field, starts, regex)
        .custom(existeDep(location, fieldDep))
        .withMessage(`'${fieldDep}' é undefined, null ou vazio`)
}

//devolve os erros de todos os invariantes, devolve apenas os invariantes que possuem erros
router.get('/testarTodos', async function (req, res){
    Invariantes.getTodosErros()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).jsonp(`Erro na obtenção de todos os erros: ${erro}`))
})

//devolve a lista com todos os invariantes caso não seja fornecido os ids (idRel e idInv). No caso de os ids serem fornecidos devolve os erros resultantes desse invariante
router.get('/', [
    verificaId('query', 'idRel', 'idInv').optional(),
    verificaId('query', 'idInv', 'idRel').optional()
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.query.idRel && req.query.idInv){
        Invariantes.getErros(req.query.idRel, req.query.idInv)
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na consulta do invariante (idRel = ${req.query.idRel}, idInv = ${req.query.idInv}): ${erro}`))
    }else{
        res.jsonp(Invariantes.listar())
    }
})

router.post('/', [
    verificaId('body', 'idRel', 'idInv'),
    verificaId('body', 'idInv', 'idRel')
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Invariantes.fixErros(req.body.idRel, req.body.idInv)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro ao tentar corrigir os erros do invariante (idRel = ${req.body.idRel}, idInv = ${req.body.idInv}): ${erro}`))
})

module.exports = router;
