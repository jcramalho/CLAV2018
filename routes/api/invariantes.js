var Auth = require('../../controllers/auth.js');
var Invariantes = require('../../controllers/api/invariantes.js');

var express = require('express');
var router = express.Router();

//devolve os erros de todos os invariantes, devolve apenas os invariantes que possuem erros
router.get('/testarTodos', Auth.isLoggedInUser, Auth.checkLevel(6), async function (req, res){
    Invariantes.getTodosErros()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).jsonp(`Erro na obtenção de todos os erros: ${erro}`))
})

//devolve a lista com todos os invariantes caso não seja fornecido os ids (idRel e idInv). No caso de os ids serem fornecidos devolve os erros resultantes desse invariante
router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), async function (req, res) {

    var dados
    if(req.query.idRel!=null && req.query.idInv!=null){

        try{
            dados = await Invariantes.getErros(req.query.idRel, req.query.idInv)
            res.jsonp(dados)
        }catch(erro){
            res.status(500).send(`Erro na consulta do invariante (idRel = ${req.query.idRel}, idInv = ${req.query.idInv}): ${erro}`)
        }

    }else{
        dados = Invariantes.listar()
        res.jsonp(dados)
    }
})

module.exports = router;
