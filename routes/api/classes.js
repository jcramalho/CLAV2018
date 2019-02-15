var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Classes = require('../../controllers/api/classes.js');
var State = require('../../controllers/state.js')
var axios = require('axios');

var express = require('express');
var router = express.Router();

// Devolve as classes em vários formatos podendo ser filtradas por nível 
router.get('/', async (req, res) => { 
    try {
        if(req.query.formato == "arvore"){
            res.jsonp(await State.getAllClasses());
        }
        else if(req.query.formato == "lista"){
            res.jsonp(await State.getClassesFlatList());
        }
        else if(req.query.nivel){
            switch(req.query.nivel){
                case '1': try {
                        res.jsonp(await State.getLevel1Classes());
                        break  
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 1: ${err}`)
                        break
                    }
                case '2': try {
                        res.jsonp(await State.getLevel2Classes());  
                        break
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 2: ${err}`)
                        break
                    }  
                case '3': try {
                        res.jsonp(await State.getLevel3Classes()); 
                        break 
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 3: ${err}`)
                        break
                    }
                case '4': try {
                        res.jsonp(await State.getLevel4Classes()); 
                        break 
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 4: ${err}`)
                        break
                    }
            }
        }
        else{
            res.jsonp(await State.getAllClasses());
        }
    } catch(err) {
        res.status(500).send(`Erro na listagem geral das classes: ${err}`)
    }
})

// Verifica se um determinado código de classe já existe
router.get('/verificar/:codigo', async (req, res) => {
    try {
        res.jsonp(await State.verificaCodigo(req.params.codigo)) 
    } catch(err) {
        res.status(500).send(`Erro na verificação de um código: ${err}`)
    }
})

router.get('/:id', async function (req, res) {
    try {
        res.jsonp(await Classes.retrieve(req.params.id)) 
    } catch(err) {
        res.status(500).send(`Erro na recuperação da classe ` + req.params.id + `: ${err}`)
    }
})

// Devolve a metainformação de uma classe: codigo, titulo, status, desc, codigoPai?, tituloPai?, procTrans?, procTipo?
router.get('/:id/meta', function (req, res) {
    Classes.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de filhos de uma classe: id, codigo, titulo, nFilhos
router.get('/:id/descendencia', function (req, res) {
    Classes.descendencia(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da descendência da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de aplicação de uma classe: idNota, nota
router.get('/:id/notasAp', (req, res) => {
    Classes.notasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de exemplos das notas de aplicação de uma classe: [exemplo]
router.get('/:id/exemplosNotasAp', (req, res) => {
    Classes.exemplosNotasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos exemplos das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de exclusão de uma classe: idNota, nota
router.get('/:id/notasEx', (req, res) => {
    Classes.notasEx(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta das notas de exclusão da classe ${req.params.id}: ${erro}`))
})

// Devolve os termos de índice de uma classe: idTI, termo
router.get('/:id/ti', (req, res) => {
    Classes.ti(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos termos de índice da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) dona(s) do processo: id, tipo, sigla, designacao
router.get('/:id/dono', (req, res) => {
    Classes.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos donos da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) participante(s) do processo: id, sigla, designacao, tipoParticip
router.get('/:id/participante', (req, res) => {
    Classes.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos participantes da classe ${req.params.id}: ${erro}`))
})

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
router.get('/:id/procRel', (req, res) => {
    Classes.procRel(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos relacionados com a classe ${req.params.id}: ${erro}`))
})

// Devolve a legislação associada ao contexto de avaliação: id, tipo, numero, sumario
router.get('/:id/legislacao', (req, res) => {
    Classes.legislacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da legislação associada à classe ${req.params.id}: ${erro}`))
})

// Devolve a informação base do PCA: idPCA, formaContagem, subFormaContagem, idJustificacao, valores, notas
router.get('/:id/pca', (req, res) => {
    Classes.pca(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do PCA associado à classe ${req.params.id}: ${erro}`))
})

// Devolve uma justificação, PCA ou DF, que é composta por uma lista de critérios: criterio, tipoLabel, conteudo
router.get('/justificacao/:id', (req, res) => {
    Classes.justificacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da justificação ${req.params.id}: ${erro}`))
})

// Devolve a informação base do DF: idDF, valor, idJustificacao
router.get('/:id/df', (req, res) => {
    Classes.df(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do DF associado à classe ${req.params.id}: ${erro}`))
        //.then(dados => res.jsonp(fa.simplificaSPARQLRes(dados, ['idDF', 'valor', 'idJustificacao'])))
        //.catch(erro => res.jsonp({cod: "404", mensagem: "Erro na consulta do DF associado à classe "+req.params.id+": " + erro}))
})

// Falta testar e decidir o que devolver
router.get('verifica/:codigo', (req, res) => {
    Classes.verificaCodigo(req.params.codigo, req.params.codigo.split('.').length)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na verificação da existência do código ${req.params.codigo}: ${erro}`))
})


// ================================================================================
// Daqui para baixo ainda pode ser aproveitado...




/* router.get('/', (req, res) => {
    Classes.filterNone()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
}) */


router.get('/filtrar/comuns', function (req, res) {
    Classes.filterCommon()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/filtrar/restantes/(:tipols)?', function (req, res) {
    if(req.params.tipols){
        var orgs = req.params.tipols.split(',');
    }

    Classes.filterRest(orgs)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/filtrar/:orgs', function (req, res) {
    Classes.filterByOrgs(req.params.orgs.split(','))
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/descendenciaIndex', function (req, res) {
    Classes.childrenNew(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.put('/:id', Auth.isLoggedInAPI, function (req, res) {
    var dataObj = req.body;
    
    Classes.updateClass(dataObj)
        .then(function (response) {
            Logging.logger.info('Update a classe \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

            req.flash('success_msg', 'Info. de Classe actualizada');
            res.send("Ok");
        })
        .catch(error => console.error(error));
})

router.post('/', Auth.isLoggedInAPI, function (req, res) {
    var dataObj = req.body;

    Classes.checkCodeAvailability(dataObj.Code, dataObj.Level)
        .then(function (count) {
            if (count > 0) {
                res.send("Código já existente!");
            }
            else {
                Classes.createClass(dataObj)
                    .then(function () {
                        Logging.logger.info('Submetida classe \'c' + dataObj.Code + '\' por utilizador \'' + req.user._id + '\'');
                        
                        let pedidoData = {
                            type: "Novo PN",
                            desc: "Novo processo de negócio",
                            id: "c" + dataObj.Code,
                            alt: null
                        }

                        Pedidos.add(pedidoData, req, res);
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error("Erro a checkar o codigo: " + error))

})

router.delete('/:id', Auth.isLoggedInAPI, function (req, res) {
    Classes.deleteClass(req.params.id)
        .then(function () {
            Logging.logger.info('Desativada classe \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

            req.flash('success_msg', 'Classe desativada');
            res.send("Entrada apagada!");
        })
        .catch(function (error) {
            console.error(error);
        });
})

module.exports = router;
