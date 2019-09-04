var Auth = require('../../controllers/auth.js');
var Vocabulario = require('../../controllers/api/vocabularios.js');

var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    Vocabulario.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na listagem dos VC: " + erro))
})

// Devolve a lista de termos de um VC: idtermo, termo
router.get('/:id', function (req, res) {
    Vocabulario.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na consulta do VC "+req.params.id+": " + erro))
})

//Update da Legenda e da Descrição de um VC
router.put('/:id', (req, res) => {
    var label = req.body.label
    var desc = req.body.desc
    if(typeof label !== "undefined" && typeof desc !== "undefined")
        Vocabulario.update(req.params.id,label,desc)
            .then(dados => {
                if(dados) res.jsonp("VC modificado com sucesso")
                else res.status(404).jsonp("Erro na modificação do VC "+req.params.id)
            })
            .catch(erro => res.status(404).jsonp("Erro no update do VC "+req.params.id+": " + erro))    
    else res.status(404).jsonp("Erro no update do VC "+req.params.id+": Label or desc Undefined")

})

//Adiciona um VC
router.post('/', (req, res) => {
    var id = req.body.id
    var label = req.body.label
    var desc = req.body.desc
    if(typeof id !== "undefined" && typeof label !== "undefined" && typeof desc !== "undefined") {
        if(!/^vc_/.test(id)) id = "vc_"+id
        Vocabulario.adicionar(id,label,desc)
            .then(dados => {
                if(dados) res.jsonp("VC adicionado com sucesso")
                else res.status(404).jsonp("Erro na adição do VC "+req.body.id)
            })
            .catch(erro => res.status(404).jsonp("Erro na adição do VC "+req.body.id+": " + erro))
    } else res.status(404).jsonp("Erro na adição do VC: Campos em falta")
})

//Adiciona um Termo a um VC
router.post('/termo/:idVC', (req, res) => {
    var idVC = req.params.idVC
    var id = idVC+"_"+req.body.idtermo
    var termo = req.body.termo
    var desc = req.body.desc
    if(typeof id !== "undefined" && typeof termo !== "undefined" && typeof desc !== "undefined") {
        Vocabulario.adicionarTermo(idVC,id,termo,desc)
            .then(dados => {
                if(dados) res.jsonp("Termo adicionado a VC com sucesso")
                else res.status(404).jsonp("Erro na adição de Termo a VC "+req.body.id)
            })
            .catch(erro => res.status(404).jsonp("Erro na adição de Termo a VC "+req.body.id+": " + erro))
    } else res.status(404).jsonp("Erro na adição de Termo a VC: Campos em falta")
})

//Update da Legenda e da Descrição de um VC
router.delete('/termo/:id', (req, res) => {
    var id = req.params.id
    Vocabulario.deleteTermo(id)
        .then(dados => {
            if(dados) res.jsonp("Termo de VC apagado com sucesso")
            else res.status(404).jsonp("Erro na remoção do Termo de VC "+id)
        })
        .catch(erro => res.status(404).jsonp("Erro na remoção do Termo de VC "+id+": " + erro))
})

module.exports = router;
