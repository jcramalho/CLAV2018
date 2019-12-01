
var Auth = require('../../controllers/auth.js');
var AutosEliminacao = require('../../controllers/api/autosEliminacao.js');
var User = require('../../controllers/api/users.js')
var excel2Json = require('../../controllers/conversor/xslx2json')

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInKey, (req, res) => {
    AutosEliminacao.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na listagem dos AE: " + erro))
})

router.get('/:id', Auth.isLoggedInKey, function (req, res) {
    AutosEliminacao.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na consulta do AE "+req.params.id+": " + erro))
})

//Criar um AE
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    User.getUserById(req.user.id, function (err, user) {
        if(err ) res.status(500).json(`Erro na consulta de utilizador para criação do AE: ${err}`)
        else {
            AutosEliminacao.criar(req.body.auto, user.name, user.email)
                .then(dados => {
                    res.jsonp("Auto de Eliminação adicionado aos pedidos com sucesso com codigo: "+dados.codigo)
                })
                .catch(erro => res.status(500).json(`Erro na criação do AE: ${erro}`))
        }
    });
        
})

//Importar um AE
router.post('/:tipo', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    var tipo = req.params.tipo
    if(tipo==="PGD") tipo = "AE PGD"
    else if(tipo === "RADA") tipo = "AE RADA"
    else tipo = "AE PGD/LC"
    User.getUserById(req.user.id, function (err, user) {
        if(err ) res.status(500).json(`Erro na consulta de utilizador para adição do AE: ${err}`)
        else {
            AutosEliminacao.importar(req.body.auto, tipo, user.name, user.email)
            .then(dados => {
                res.jsonp(tipo+" adicionado aos pedidos com sucesso com codigo: "+dados.codigo)
            })
            .catch(erro => res.status(500).json(`Erro na adição do AE: ${erro}`))
        }
    });
    
})

//Importar um AE (Inserir ficheiro diretamente pelo Servidor)
router.post('/:tipo/importar', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
    excel2Json(req.body.file, req.params.tipo)
        .then(data => {
            var tipo = req.params.tipo
            if(tipo==="PGD") tipo = "AE PGD"
            else if(tipo === "RADA") tipo = "AE RADA"
            else tipo = "AE PGD/LC"
            User.getUserById(req.user.id, function (err, user) {
                if(err ) res.status(500).json(`Erro na consulta de utilizador para importação do AE: ${err}`)
                else {
                    AutosEliminacao.importar(data.auto, tipo, user.name, user.email)
                        .then(dados => {
                            res.jsonp(tipo+" adicionado aos pedidos com sucesso com codigo: "+dados.codigo)
                        })
                        .catch(erro => res.status(500).json(`Erro na adição do AE: ${erro}`))
                }
            });
        })
        .catch(err => res.status(500).send("ERRO:"+err))
})
 
module.exports = router;
