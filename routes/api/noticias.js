var Auth = require('../../controllers/auth.js');
var Noticias = require('../../controllers/api/noticias.js')
var url = require('url')

var express = require('express')
var router = express.Router()

// Lista todas as noticias: data, titulo, desc
router.get('/', Auth.isLoggedInKey, (req, res) => {
    var validKeys = ["titulo", "desc", "data", "ativa"];
    var queryData = url.parse(req.url, true).query;
    
    var filtro = Object.entries(queryData)
        .filter(([k, v]) => v !== undefined && validKeys.includes(k))

    filtro = Object.assign({}, ...Array.from(filtro, ([k, v]) => ({[k]: v}) ));
    
    // api/noticias?recentes=sim
    if (queryData.recentes && queryData.recentes == 'sim') {
        Noticias.recentes()
            .then(dados => res.jsonp(dados))
		    .catch(erro => res.status(500).send(`Erro na listagem das noticias recentes: ${erro}`))
	} else {
        Noticias.listar(filtro)
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na listagem das noticias: ${erro}`))
    }
})

// Consulta de uma noticia: titulo, data, desc
router.get('/:id', Auth.isLoggedInKey, (req, res) => {
    Noticias.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. A noticia '${req.params.id}' não existe`))
	    .catch(erro => res.status(500).send(`Erro na consulta da noticia '${req.params.id}': ${erro}`))
})

// Update de uma Noticia
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    var titulo = req.body.titulo
    var desc = req.body.desc
    var ativa = req.body.ativa
    var data = req.body.data
    if(typeof titulo !== "undefined" && typeof desc !== "undefined" && typeof ativa !== "undefined" && typeof data !== "undefined")
        Noticias.update(req.params.id,titulo,desc,data, ativa)
            .then(dados => {
                if(dados) res.jsonp("Noticia modificado com sucesso")
                else res.status(404).jsonp("Erro na modificação da Noticia "+req.params.id)
            })
            .catch(erro => res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": " + erro))    
    else res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": Titulo, descricao ou data nao definidos")
})

// Adiciona uma noticia
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    var titulo = req.body.titulo
    var desc = req.body.desc
    var data = req.body.data
    if(typeof titulo !== "undefined" && typeof desc !== "undefined" && typeof data !== "undefined") {
        Noticias.criar({titulo,data, desc})
            .then(dados => {
                if(dados) res.jsonp("Noticia adicionada com sucesso")
                else res.status(404).jsonp("Erro na adição da Noticia " + req.body.titulo)
            })
            .catch(erro => res.status(404).jsonp("Erro na adição da Noticia "+req.body.titulo+": " + erro))
    } else res.status(404).jsonp("Erro na adição da Noticia: Campos em falta ")
})

module.exports = router;
