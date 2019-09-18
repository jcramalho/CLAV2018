var Auth = require('../../controllers/auth.js');
var SelTabs = require('../../controllers/api/tabsSel.js');

const Excel = require('exceljs/modern.nodejs');
var formidable = require("formidable")
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

router.post('/CSV', async function (req, res){
    var form = new formidable.IncomingForm()

    form.parse(req, async (error, fields, formData) => {
        if(!error){
            if(formData.file && formData.file.type && formData.file.path &&
               fields.email &&
               fields.entidade_user &&
               fields.tipo_ts &&
               (fields.entidade_ts || fields.tipo_ts == 'TS Pluriorganizacional')){
                var workbook = new Excel.Workbook();

                if(!fields.entidade_ts){
                    fields.entidade_ts = null
                }

                if(formData.file.type == "text/csv"){
                    var possibleDelimiters = [",",";","\t","|"]
                    var i = 0
                    var len = possibleDelimiters.length
                    var parsed = false

                    var options = {
                        //Substitui função por forma a não realizar parse de datas, igual a usada pelo exceljs, caso vazio devolve null, no resto devolve string
                        map: (value, index) => {
                            if (value === '') {
                                return null;
                            }
                            
                            //const datumNumber = Number(value);
                            //if (!Number.isNaN(datumNumber)) {
                            //    return datumNumber;
                            //}

                            //Em comentário por forma a não fazer parse de datas
                            //para usar dayjs fazer: const dayjs = require('dayjs');
                            //const dt = dayjs(value, dateFormats, true);
                            //if (dt.isValid()) {
                            //    return new Date(dt.valueOf());
                            //}

                            //const SpecialValues = {
                            //    true: true,
                            //    false: false,
                            //    '#N/A': {error: '#N/A'},
                            //    '#REF!': {error: '#REF!'},
                            //    '#NAME?': {error: '#NAME?'},
                            //    '#DIV/0!': {error: '#DIV/0!'},
                            //    '#NULL!': {error: '#NULL!'},
                            //    '#VALUE!': {error: '#VALUE!'},
                            //    '#NUM!': {error: '#NUM!'},
                            //}

                            //const special = SpecialValues[value];
                            //if (special !== undefined) {
                            //    return special;
                            //}
                            
                            return value;
                        }
                    }

                    while(!parsed){
                        try{
                            //tenta as várias hipóteses de delimitadores do CSV
                            options.delimiter = possibleDelimiters[i]
                            var worksheet = await workbook.csv.readFile(formData.file.path, options)
                            parsed = true
                        }catch(erro){
                            if(++i == len){
                                parsed = true
                                res.status(500).json(`Erro ao importar CSV: Não foi possível fazer parsing do ficheiro.\nOs delimitadores podem ser: , ou ; ou \\t ou |.\nPara além disso o quote e o escape são realizados através de ".\nPor fim, o encoding do ficheiro tem de ser UTF-8.`)
                            }
                        }
                    }

                    if(i < len){
                        SelTabs.criarPedidoDoCSV(workbook, fields.email, fields.entidade_user, fields.entidade_ts, fields.tipo_ts)
                            .then(codigoPedido => res.json(codigoPedido))
                            .catch(erro => res.status(500).json(`Erro ao importar CSV: ${erro}`))
                    }
                }else if(formData.file.type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
                    workbook.xlsx.readFile(formData.file.path)
                        .then(function() {
                            SelTabs.criarPedidoDoCSV(workbook, fields.email, fields.entidade_user, fields.entidade_ts, fields.tipo_ts)
                                .then(dados => res.json(dados))
                                .catch(erro => res.status(500).json(`Erro ao importar Excel: ${erro}`))
                        })
                        .catch(erro => res.status(500).json(`Erro ao importar Excel: ${erro}`))
                }else{
                    res.status(415).json(`Erro ao importar CSV/Excel: o ficheiro tem de estar no formato CSV ou Excel (.xlsx)`)
                }
            }else{
                res.status(500).json(`Erro ao importar CSV/Excel: O FormData deve possuir quatro campos: um ficheiro em file, um email em email, a sigla da entidade do utilizador em entidade_user e o tipo de TS em tipo_ts. Caso o tipo de TS seja 'TS Organizacional' deve possuir outro campo: a sigla da entidade da TS em entidade_ts.`)
            }
        }else{
            res.status(500).json(`Erro ao importar CSV/Excel: ${error}`)
        }
    })
})

module.exports = router;
