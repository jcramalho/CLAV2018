var Auth = require('../../controllers/auth.js');
var DocumentacaoCientifica = require('../../controllers/api/documentacaoCientifica.js')
var url = require('url')
var formidable = require("formidable")

// Para os ficheiros
var ncp = require('ncp').ncp;
ncp.limit = 16;
var fs = require('fs')
var path = require('path')

var express = require('express')
var router = express.Router()

// Lista toda a documentacao Científica
router.get('/', Auth.isLoggedInKey, (req, res) => {
    var validKeys = ["classe", "titulo", "url", "local", "ano", "visivel", "autores"];
    var queryData = url.parse(req.url, true).query;
    
    var filtro = Object.entries(queryData)
        .filter(([k, v]) => v !== undefined && validKeys.includes(k))

    filtro = Object.assign({}, ...Array.from(filtro, ([k, v]) => ({[k]: v}) ));

    DocumentacaoCientifica.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem da Documentação Científica: ${erro}`))
})

// Lista as classes existentes na documentação cientifica
router.get('/classes', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoCientifica.listar_classes()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das classes da Documentação Científica: ${erro}`))
})

// Devolve um ficheiro com todos os registos em formato pronto a importar no MongoDB
router.get('/exportar', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
    DocumentacaoCientifica.listar({})
        .then(function(dados){
            // Tratamento do formato do ID
            var output = dados.map(obj => {
                return {
                    ...obj._doc,
                    _id: {
                        $oid : obj._doc._id
                    }
                    
                }
            });
            // Encoding 
            var data = JSON.stringify(output, null, 2);
            res.setHeader('Content-disposition', 'attachment; filename= doc_cientifica.json');
            res.setHeader('Content-type', 'application/json');
            res.write(data, function (err) {
                res.end()
            })
        })
        .catch(erro => res.status(500).send(`Erro na exportação da Documentação Científica: ${erro}`))
})

// Consulta de uma entrada na documentação
router.get('/:id', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoCientifica.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. O elemento da Documentação '${req.params.id}' não existe`))
	    .catch(erro => res.status(500).send(`Erro na consulta do elemento da Documentação '${req.params.id}': ${erro}`))
})

// Download de um ficheiro na documentação
router.get('/:id/ficheiro', Auth.isLoggedInKey, (req, res) => {
    DocumentacaoCientifica.consultar_ficheiro(req.params.id)
        .then(dados => dados && dados.ficheiro ? res.download(path.resolve(__dirname + '/../../' + dados.ficheiro.path)) : res.status(404).send(`Erro. O ficheiro da Documentação '${req.params.id}' não existe`))
        .catch(erro => res.status(500).send(`Erro na consulta do ficheiro do elemento da Documentação '${req.params.id}': ${erro}`))
})

// POST -> ver se tem ficheiro, se sim inserir + inserir no mongo
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), function (req, res) {
    var form = new formidable.IncomingForm()
    form.parse(req, async (error, fields, formData) => {
        if(!error){
            // Verificar os dados textuais
            if(fields.classe && fields.titulo && fields.url && fields.local &&
                fields.ano && fields.visivel && fields.autores){
                    var documento = fields;
                    documento.autores = fields.autores.split(",");
                    // Verificar se existe um ficheiro no form
                    if(formData.file && formData.file.type && formData.file.path){
                        // Inserir ficheiro e gerar objeto para mongo
                        var oldPath = formData.file.path;
                        var dbpath = '/public/documentacao_apoio/Produção_Técnica_e_Científica/' + fields.classe.replace(/ /g, '_') + '/' + formData.file.name;
                        var newPath = path.resolve(__dirname + '/../../' + dbpath);
                        
                        fs.rename(oldPath, newPath, function (err) {
                            if (err) {
                                res.status(500).json(`Erro na adição da Documentação: ${err}`)
                            }
                            else {
                                var novoFicheiro = { 
                                    data: formData.file.mtime,
                                    nome: formData.file.name,
                                    path: dbpath, 
                                    mimetype: formData.file.type, 
                                    size: formData.file.size
                                };
                                documento.ficheiro = novoFicheiro;
                                DocumentacaoCientifica.criar(documento)
                                    .then(dados => {
                                        if(dados) res.jsonp("Documentação adicionada com sucesso")
                                        else res.status(404).jsonp("Erro na adição da Documentação " + documento.titulo)
                                    })
                                    .catch(erro => res.status(404).jsonp("Erro na adição da Documentação " + documento.titulo + ": " + erro))
                            }
                        })
                    } else {
                        DocumentacaoCientifica.criar(documento)
                            .then(dados => {
                                if(dados) res.jsonp("Documentação adicionada com sucesso")
                                else res.status(404).jsonp("Erro na adição da Documentação " + documento.titulo)
                            })
                            .catch(erro => res.status(404).jsonp("Erro na adição da Documentação " + documento.titulo + ": " + erro))
                    }
                }
            else {
                res.status(500).json(`Erro nos campos da documentação: ${JSON.stringify(documento)}`)
            }
        }
        else {
            res.status(500).json(`Erro na adição da Documentação: ${error}`)
        }
    })
})

// PUT - remover ficheiro antigo se necessario, inserir novo se existente + atualizar objeto
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), (req, res) => {
   var form = new formidable.IncomingForm()
   form.parse(req, async (error, fields, formData) => {
       if(!error){
           // Verificar os dados textuais
           if(fields.classe && fields.titulo && fields.url && fields.local &&
               fields.ano && fields.visivel && fields.autores){
                
                var documento = fields;
                documento.autores = fields.autores.split(",")
                
                DocumentacaoCientifica.consultar(req.params.id)
                    .then(function(dados) { 
                        if(dados){
                            // Verificar se existe um ficheiro no form ou se passou a ser um link
                            if((formData.file && formData.file.type && formData.file.path) || fields.url != "FICHEIRO"){
                                // Se existir ficheiro tem que ser apagado 
                                if(dados.ficheiro){
                                    fs.unlink(path.resolve(__dirname + '/../../' + dados.ficheiro.path), function (err) {
                                        if (err){
                                            res.status(500).json(`Erro na atualização da Documentação: ${err}`)
                                        }
                                    });
                                }    
                                // Novo Ficheiro 
                                if(formData.file && formData.file.type && formData.file.path){
                                    // Inserir ficheiro e gerar objeto para mongo
                                    var oldPath = formData.file.path;
                                    var dbpath = '/public/documentacao_apoio/Produção_Técnica_e_Científica/' + fields.classe.replace(/ /g, '_') + '/' + formData.file.name;
                                    var newPath = path.resolve(__dirname + '/../../' + dbpath);
                                    
                                    fs.rename(oldPath, newPath, function (err) {
                                        if (err){
                                            res.status(500).json(`Erro na atualização da Documentação: ${err}`)
                                        } else {
                                            var novoFicheiro = { 
                                                data: formData.file.mtime,
                                                nome: formData.file.name,
                                                path: dbpath, 
                                                mimetype: formData.file.type, 
                                                size: formData.file.size
                                            };
                                            documento.ficheiro = novoFicheiro;
                                            // Atualizar da Base de Dados
                                            DocumentacaoCientifica.update(req.params.id, documento)
                                                .then(dados => {
                                                    if(dados) res.jsonp("Documentação modificado com sucesso")
                                                    else res.status(404).jsonp("Erro na modificação da Documentação " + req.params.id)
                                                })
                                                .catch(erro => res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": " + erro))   
                                        }
                                    })
                                } else {
                                    // Atualizar da Base de Dados
                                    DocumentacaoCientifica.update(req.params.id, documento)
                                        .then(dados => {
                                            if(dados) res.jsonp("Documentação modificado com sucesso")
                                            else res.status(404).jsonp("Erro na modificação da Documentação " + req.params.id)
                                        })
                                        .catch(erro => res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": " + erro))
                                }
                            }
                            // Caso seja alterada a classe da entrada, o ficheiro tem que ser mudado de pasta 
                            else if(dados.classe !== fields.classe && dados.ficheiro !== undefined){
                                var antes = path.resolve(__dirname + '/../../' + dados.ficheiro.path);
                                var dbpath = '/public/documentacao_apoio/Produção_Técnica_e_Científica/' + fields.classe.replace(/ /g, '_') + '/' + dados.ficheiro.nome;
                                var depois = path.resolve(__dirname + '/../../' + dbpath);
                                    
                                fs.rename(antes, depois, function (err) {
                                    if (err){
                                        res.status(500).json(`Erro na atualização da Documentação: ${err}`)
                                    } else {
                                        var ficheiro_atualizado = dados.ficheiro;
                                        ficheiro_atualizado.path = dbpath;
                                        documento.ficheiro = ficheiro_atualizado;
                                        // Atualizar da Base de Dados
                                        DocumentacaoCientifica.update(req.params.id, documento)
                                            .then(dados => {
                                                if(dados) res.jsonp("Documentação modificado com sucesso")
                                                else res.status(404).jsonp("Erro na modificação da Documentação " + req.params.id)
                                            })
                                            .catch(erro => res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": " + erro))   
                                    }
                                })
                            } else {
                                // Caso nao altere o ficheiro ja existente
                                if(dados.ficheiro !== undefined) {
                                    documento.ficheiro = dados.ficheiro;
                                }
                                // Atualizar da Base de Dados
                                DocumentacaoCientifica.update(req.params.id, documento)
                                    .then(dados => {
                                        if(dados) res.jsonp("Documentação modificado com sucesso")
                                        else res.status(404).jsonp("Erro na modificação da Documentação " + req.params.id)
                                    })
                                    .catch(erro => res.status(404).jsonp("Erro no update da Noticia "+req.params.id+": " + erro))   
                            }
                        } 
                        else {
                            res.status(404).send(`Erro. O elemento da Documentação '${req.params.id}' não existe`)
                        }
                    })
                    .catch(erro => res.status(500).send(`Erro na eliminação do elemento da Documentação '${req.params.id}': ${erro}`))
               }
           else {
               res.status(500).json(`Erro nos campos da documentação: ${JSON.stringify(documento)}`)
           }
       }
       else {
           res.status(500).json(`Erro na atualização da Documentação: ${error}`)
       }
   })
})


// DELETE -> ver se tem ficheiro, se sim apagar + apagar registo do mongo
router.delete('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), async function(req, res) {
    // GET -> ver se tem ficheiro 
    DocumentacaoCientifica.consultar(req.params.id)
        .then(function(dados) { 
            if(dados){
                // Se existir ficheiro tem que ser apagado 
                if(dados.ficheiro){
                    fs.unlink(path.resolve(__dirname + '/../../' + dados.ficheiro.path), function (err) {
                        if (err){
                            res.status(500).send(`Erro na eliminação do elemento da Documentação '${req.params.id}': ${err}`)
                        } else {
                            // Apagar da Base de Dados
                            DocumentacaoCientifica.eliminar(req.params.id, function(err, user){
                                if(err){
                                    res.status(500).send("Não foi possível eliminar a documentação!");
                                }else{
                                    res.send('Documentação eliminada com sucesso!');
                                }
                            })
                        }
                    });
                }
                else {
                    // Apagar da Base de Dados
                    DocumentacaoCientifica.eliminar(req.params.id, function(err, user){
                        if(err){
                            res.status(500).send("Não foi possível eliminar a documentação!");
                        }else{
                            res.send('Documentação eliminada com sucesso!');
                        }
                    })
                }
            } 
            else {
                res.status(404).send(`Erro. O elemento da Documentação '${req.params.id}' não existe`)
            }
        })
	    .catch(erro => res.status(500).send(`Erro na eliminação do elemento da Documentação '${req.params.id}': ${erro}`))
});

module.exports = router;