var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Classes = require('../../controllers/api/classes.js');

var preCalc = require('../../controllers/api/aux').preCalc
var jsonfile = require('jsonfile')
var classesPreCalc = new Promise((resolve,reject)=>{
    jsonfile.readFile(__dirname + '/../../data/classes-preCalc.json', (erro, classes)=>{
        if(erro){
            console.log('Erro no carregamento das classes PreCalc: ' + erro)
            reject([])
        } 
        else if(classes.length == 0){
            console.log('Pré-calculando a árvore de classes...')
            preCalc()
                .then(classes2 => {
                    resolve(classes2)
                })
                .catch(erro => reject([]))
        }
        else resolve(classes)
    })
})
    

var express = require('express');
var router = express.Router();

router.get('/', (req, res) => { 
    classesPreCalc
        .then(v => res.jsonp(v))
        .catch(erro => res.status(500).send(`Erro na listagem das classes de nível 1 (classesPreCalc): ${erro}`)) 
})

// Devolve a lista de classes de nível 1: id, codigo, titulo
/*router.get('/', (req, res) => { 
    Classes.listar(null)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das classes de nível 1 (omisso na query): ${erro}`))
})*/

// Devolve a lista de classes de nível n [1..4]: [id, codigo, titulo]
router.get('/nivel/:n', (req, res) => {
    Classes.listar(req.params.n)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das classes de nível  ${req.params.n}: ${erro}`))
})

// Devolve a metainformação de uma classe: codigo, titulo, status, desc, codigoPai?, tituloPai?, procTrans?, procTipo?
router.get('/:id', function (req, res) {
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
        .then(dados => res.jsonp(fa.simplificaSPARQLRes(dados, ['idDF', 'valor', 'idJustificacao'])))
        .catch(erro => res.jsonp({cod: "404", mensagem: "Erro na consulta do DF associado à classe "+req.params.id+": " + erro}))
})



// ================================================================================
// Daqui para baixo ainda pode ser aproveitado...




router.get('/', (req, res) => {
    Classes.filterNone()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})


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

router.get('/:id', function (req, res) {
    Classes.stats(req.params.id)
        .then(clas => res.send(clas))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/descendencia', function (req, res) {
    Classes.children(req.params.id)
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

router.get('/:id/donos', function (req, res) {
    Classes.owners(req.params.id)
        .then(owners => res.send(owners))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/legislacao', function (req, res) {
    Classes.legislation(req.params.id)
        .then(legs => res.send(legs))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/exemplosNotasAp', function (req, res) {
    Classes.exAppNotes(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/notasAp', function (req, res) {
    Classes.appNotes(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/notasEx', function (req, res) {
    Classes.delNotes(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/relacionados', function (req, res) {
    Classes.related(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/participantes', function (req, res) {
    Classes.participants(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/pca', function (req, res) {
    Classes.pca(req.params.id)
        .then(function (data) {
            let criteria = data.Criterios.value.split("###");
            criteria = criteria.map(a => a.replace(/[^#]+#(.*)/, '$1'));

            Classes.criteria(criteria)
                .then(function (criteriaData) {

                    data.Criterios.type = "array";
                    data.Criterios.value = criteriaData;

                    res.send(data);
                })
                .catch(error=>console.error(error));
        })
        .catch(error=>console.error(error));
})

router.get('/:id/df', function (req, res) {
    Classes.df(req.params.id)
        .then(function (data) {
            let criteria = data.Criterios.value.split("###");
            criteria = criteria.map(a => a.replace(/[^#]+#(.*)/, '$1'));

            Classes.criteria(criteria)
                .then(function (criteriaData) {
                    data.Criterios.type = "array";
                    data.Criterios.value = criteriaData;

                    res.send(data);
                })
                .catch(error=>console.error(error));
        })
        .catch(error=>console.error(error));
})

router.get('/:code/check/:level', function (req, res) {
    Classes.checkCodeAvailability(req.params.code, req.params.level)
        .then(function (count) {
            res.send(count);
        })
        .catch(error=>console.error(error));
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
