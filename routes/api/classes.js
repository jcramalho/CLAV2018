var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');

var Classes = require('../../controllers/api/classes.js');
var TermosIndice = require('../../controllers/api/termosIndice.js');

var Pedido = require('../../models/pedido');
var Entidade = require('../../models/entidade');

var express = require('express');
var router = express.Router();


router.get('/', function (req, res) {
    Classes.list(1)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/nivel=:n', function (req, res) {
    Classes.list(req.params.n)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/filtrar', function (req, res) {
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

router.get('/filtrar/restantes/(:orgs)?', function (req, res) {
    if(req.params.orgs){
        var orgs = req.params.orgs.split(',');
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
    Classes.updateClass(req.body.dataObj)
        .then(function (response) {
            Logging.logger.info('Update a classe \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

            req.flash('success_msg', 'Info. de Classe actualizada');
            res.send("Actualizado!");
        })
        .catch(error => console.error(error));
})

router.post('/', function (req, res) {
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
                        

                        //-------- GERAR PEDIDO -------------------------------------

                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth()+1;
                        var yyyy = today.getFullYear();

                        Pedido.getCountPedidos(function(err, count){
                            if (err) {
                                console.log(err);
                                req.send("Ocorreu um erro ao gerar o pedido");    
                            }
                            else {
                                var num = count+1+"-"+yyyy;
                                var entity;

                                Entidade.getEntidadeByRepresentante(req.user.email, function(err, ent){
                                    if (err) {
                                        console.log(err);
                                        req.send("Ocorreu um erro!");    
                                    }
                                    else {
                                        if(!ent){
                                            entity = {
                                                nome: "Sem entidade relacionada",
                                                email: req.user.email
                                            }
                                        }
                                        else {
                                            entity = ent;
                                        }

                                        var newPedido = new Pedido({
                                            numero: num,
                                            tipo: "Novo PN",
                                            descricao: "Novo processo de negócio",
                            
                                            entidade: {
                                                nome: entity.nome,
                                                email: entity.email
                                            },
                            
                                            utilizador: {
                                                nome: req.user.name,
                                                email: req.user.email,
                                            },
                            
                                            data: dd+"/"+mm+"/"+yyyy,
                                            tratado: false,
                    
                                            objetoID: "c"+dataObj.Code,
                                            alterado: null,
                                        });
                                        
                                        Pedido.createPedido(newPedido, function (err, request) {
                                            if (err) {
                                                console.log(err);
                                                req.flash('error_msg', 'Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
                                                req.send('Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
                                            }
                                            else {
                                                Logging.logger.info('Novo pedido ' + request.tipo + ': '+request.numero+' submetido por '+req.user._id);
                        
                                                req.flash('success_msg', 'Pedido submetido com sucesso!');
                                                res.send(request.numero);
                                            }
                                        });  
                                    } 
                                });
                            }
                        });

                        //----------------------------------------------------------

                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error("Erro a checkar o codigo: " + error))

})

router.delete('/:id', Auth.isLoggedInAPI, function (req, res) {
    Classes.deleteClass(req.params.id)
        .then(function () {
            Logging.logger.info('Apagada classe \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

            req.flash('success_msg', 'Entrada apagada');
            res.send("Entrada apagada!");
        })
        .catch(function (error) {
            console.error(error);
        });
})

module.exports = router;
