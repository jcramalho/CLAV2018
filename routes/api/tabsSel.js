var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var SelTabs = require('../../controllers/api/tabsSel.js');
var Classes = require('../../controllers/api/classes.js');
var Trabalhos = require('../../controllers/api/trabalhos_guardados.js');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    SelTabs.list()
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/classes', function (req, res) {
    SelTabs.listClasses(req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id/classes/:parent/descendencia', function (req, res) {
    SelTabs.classChildren(req.params.parent,req.params.id)
        .then(list => res.send(list))
        .catch(function (error) {
            console.error(error);
        });
})

router.get('/:id', function (req, res) {
    SelTabs.stats(req.params.id)
        .then(result => res.send(result))
        .catch(function (error) {
            console.error(error);
        });
})

router.post('/', Auth.isLoggedInAPI, function (req, res) {
    //generate a new ID
    function genID(ids) {
        var newIDNum = 1;

        var list = ids
            .map(item => parseInt(
                item.id.value.replace(/[^#]+#ts_(.*)/, '$1')
            )).sort((a, b) => a - b)

        for (var i = 0; i < list.length; i++) {
            var idNum = list[i];

            if (newIDNum == idNum) {
                newIDNum++;
            }
            else {
                break;
            }
        }
        return "ts_" + newIDNum;
    }

    var dataObj = req.body;

    SelTabs.list()
        .then(function (list) {
            
            var id = genID(list);
            
            Classes.completeData(dataObj.classes)
                .then(function(classes){
                    
                    let relations = ["Rels1","Rels2","Rels3","Rels4","Rels5","Rels6","Rels7"];
                    var crits = [];
                    // filtrar relações por PNs que estejam na tabela
                    for(let clas of classes){
                        for(let rel of relations){
                            clas[rel].value = clas[rel].value
                                .split('%%')
                                .map(a => a.replace(/[^#]+#(.*)/, '$1'))
                                .filter(a=>dataObj.classes.indexOf(a)>-1)
                                .map( a => id+"_"+a)
                                .join('%%');
                        }
                        if(clas.Crits.value){
                            for(let c of clas.Crits.value.split('%%')){
                                crits.push(c.replace(/[^#]+#(.*)/, '$1'));
                            }
                        }
                    }
                    crits = crits.filter(a=>a!="");

                    Classes.criteriaMin(crits)
                        .then(function(criteriaData) {

                            SelTabs.createTab(id, dataObj.name, classes, criteriaData)
                                .then(function () {
                                    Logging.logger.info('Criada Tabela de Seleção \'' + id + '\' por utilizador \'' + req.user._id + '\'');

                                    let trab = {
                                        type: "TS: Alterar PNs",
                                        objID: id,
                                    } 

                                    Trabalhos.add(trab, req, res);
                                })
                                .catch(error => console.error(error)
                                );
                        })
                        .catch(error=>console.error(error));
                    
                    
                })
                .catch(error => console.error(error)
                );
        })
        .catch(error => console.error(error)
        );
})

module.exports = router;
