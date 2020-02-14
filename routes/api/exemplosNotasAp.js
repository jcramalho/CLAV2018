var Auth = require('../../controllers/auth.js');
var ExemplosNotasAp = require('../../controllers/api/exemplosNotasAp.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

// Devolve a lista de todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
router.get('/', Auth.isLoggedInKey, (req, res) => {
    if(req.query.existe){
        // Verifica se umo determinado exemplo de notaAplicação já existe
        State.verificaExemploNA(req.query.existe)
            .then(dados => res.jsonp(dados))           
            .catch(erro => res.status(500).send(`Erro na verificação de um exemplo de nota de aplicação: ${erro}`))
    }else{
        ExemplosNotasAp.todosExemplosNotasAp()
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na recuperação total dos exemplos das notas de aplicação: ${erro}`))
    }
})

module.exports = router;
