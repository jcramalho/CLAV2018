var Invariantes = require('../../controllers/api/invariantes.js');

var express = require('express');
var router = express.Router();

//devolve a lista com todos os invariantes caso não seja fornecido os ids (idRel e idInv). No caso de os ids serem fornecidos devolve os erros resultantes desse invariante
router.get('/', async function (req, res) {

    if(req.query.idRel!=null && req.query.idInv!=null){

        try{
            var dados = await Invariantes.getErros(req.query.idRel, req.query.idInv)
            res.jsonp(dados)
        }catch(erro){
            res.status(500).send(`Erro na consulta do invariante (idRel = ${req.query.idRel}, idInv = ${req.query.idInv}): ${erro}`)
        }

    }else{
        var dados = Invariantes.listar()
        res.jsonp(dados)
    }
})

module.exports = router;
