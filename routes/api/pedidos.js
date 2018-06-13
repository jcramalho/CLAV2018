var express = require('express');
var router = express.Router();

var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Pedido = require('../../models/pedido');
var Entidade = require('../../models/entidade');

// Novo pedido
router.post('/', Auth.isLoggedInAPI, function (req, res) {
    var dataObj= req.body;
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();

    Pedido.getCountPedidos(function(err, count){
        if (err) {
            console.log(err);
            res.send("Ocorreu um erro!");    
        }
        else {
            var num = count+1+"-"+yyyy;

            Entidade.getEntidadeByRepresentante(req.user.email, function(err, entity){
                if (err) {
                    console.log(err);
                    res.send("Ocorreu um erro!");    
                }
                else if(!entity) {
                    console.log("Utilizador sem entidade relacionada");
                    res.send("Ocorreu um erro! Sem entidade associada!"); 
                }
                else{
                    var newPedido = new Pedido({
                        numero: num,
                        tipo: dataObj.type,
                        descricao: dataObj.desc,
        
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

                        objetoID: dataObj.id,
                        alterado: dataObj.alt,
                    });
                    
                    Pedido.createPedido(newPedido, function (err, request) {
                        if (err) {
                            console.log(err);
                            req.flash('error_msg', 'Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
                            res.send('Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
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
});

// Pedidos por estado
router.get('/estado/:estado', Auth.isLoggedInAPI, function (req, res) {
    Pedido.getPedidosByState(req.params.estado, function(err, request){
        if (err) {
            console.log(err);
            res.send("Ocorreu um erro!");    
        }
        else{
            res.send(request);
        }
    });
});

// Dados de um pedido
router.get('/numero/:num', Auth.isLoggedInAPI, function (req, res) {
    Pedido.getPedidoByNumber(req.params.num, function(err, request){
        if (err) {
            console.log(err);
            res.send("Ocorreu um erro!");    
        }
        else if (!request){
            res.send("Não existe um pedido com esse número!");   
        }
        else{
            var dataObj = {
                num: request.numero,
                tipo: request.tipo,
                desc: request.descricao,
                data: request.data,
                obj: request.objetoID
            }

            res.send(dataObj);
        }
    });
});

// Pedidos por utilizador
router.get('/utilizador', Auth.isLoggedInAPI, function (req, res) {

    let user = req.user.email;

    Pedido.getPedidosByUser(user, function(err, request){
        if (err) {
            console.log(err);
            res.send("Ocorreu um erro!");    
        }
        else{
            let dataObj = request.map(
                function(a){
                    return {
                        num: a.numero,
                        tipo: a.tipo,
                        desc: a.descricao,
                        data: a.data,
                        obj: a.objetoID
                    }
                }
            )
            res.send(dataObj);
        }
    });
});

// Pedidos por utilizador
router.get('/utilizador/:user', Auth.isLoggedInAPI, function (req, res) {

    let user = req.params.user || req.user.email;

    Pedido.getPedidosByUser(user, function(err, request){
        if (err) {
            console.log(err);
            res.send("Ocorreu um erro!");    
        }
        else{
            res.send(request);
        }
    });
});

module.exports = router;