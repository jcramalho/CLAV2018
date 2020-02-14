var Auth = require('../../controllers/auth.js');
var NotasAp = require('../../controllers/api/notasAp.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

// Devolve a lista de todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
router.get('/', Auth.isLoggedInKey, (req, res) => {
    if(req.query.existe){
        // Verifica se uma determinada notaAplicação já existe
        State.verificaNA(req.query.existe)
            .then(dados => res.jsonp(dados))           
            .catch(erro => res.status(500).send(`Erro na verificação de uma nota de aplicação: ${erro}`))
    }else{
        NotasAp.todasNotasAp()
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na recuperação total das notas de aplicação: ${erro}`))
    }
})

module.exports = router;
