var Auth = require('../../controllers/auth.js');
var Vocabulario = require('../../controllers/api/vocabularios.js');

var express = require('express');
var router = express.Router();

const { query, body, validationResult } = require('express-validator');
const { existe, verificaVCId, verificaTermoVCId } = require('../validation')

router.get('/', Auth.isLoggedInKey, (req, res) => {
    Vocabulario.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).jsonp("Erro na listagem dos VC: " + erro))
})

// Devolve a lista de termos de um VC: idtermo, termo
router.get('/:id', Auth.isLoggedInKey, [
    verificaVCId('param', 'id')
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Vocabulario.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).jsonp("Erro na consulta do VC "+req.params.id+": " + erro))
})

//Update da Legenda e da Descrição de um VC
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), [
    verificaVCId('param', 'id'),
    existe('body', 'label'),
    existe('body', 'desc')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Vocabulario.update(req.params.id, req.body.label, req.body.desc)
        .then(dados => {
            if(dados) res.jsonp("VC modificado com sucesso")
            else res.status(500).jsonp("Erro na modificação do VC "+req.params.id)
        })
        .catch(erro => res.status(500).jsonp("Erro no update do VC "+req.params.id+": " + erro))
})

//Adiciona um VC
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), [
    verificaVCId('body', 'id'),
    existe('body', 'label'),
    existe('body', 'desc')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Vocabulario.adicionar(req.body.id, req.body.label, req.body.desc)
        .then(dados => {
            if(dados) res.jsonp("VC adicionado com sucesso")
            else res.status(500).jsonp("Erro na adição do VC "+req.body.id)
        })
        .catch(erro => res.status(500).jsonp("Erro na adição do VC "+req.body.id+": " + erro))
})

//Adiciona um Termo a um VC
router.post('/termo/:idVC', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), [
    verificaVCId('param', 'idVC'),
    existe('body', 'idtermo'),
    existe('body', 'termo'),
    existe('body', 'desc')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var id = req.params.idVC + "_" + req.body.idtermo
    Vocabulario.adicionarTermo(req.params.idVC, id, req.body.termo, req.body.desc)
        .then(dados => {
            if(dados) res.jsonp("Termo adicionado a VC com sucesso")
            else res.status(500).jsonp("Erro na adição de Termo a VC "+req.body.id)
        })
        .catch(erro => res.status(500).jsonp("Erro na adição de Termo a VC "+req.body.id+": " + erro))
})

//Update da Legenda e da Descrição de um VC
router.delete('/termo/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), [
    verificaTermoVCId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Vocabulario.deleteTermo(req.params.id)
        .then(dados => {
            if(dados) res.jsonp("Termo de VC apagado com sucesso")
            else res.status(500).jsonp("Erro na remoção do Termo de VC "+req.params.id)
        })
        .catch(erro => res.status(500).jsonp("Erro na remoção do Termo de VC "+req.params.id+": " + erro))
})

module.exports = router;
