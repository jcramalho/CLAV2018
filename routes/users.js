var express = require('express');
var router = express.Router();

var Logging = require('../controllers/logging');

var Auth = require('../controllers/auth.js');
var User = require('../models/user');
var Pedido = require('../models/pedido');
var Entidade = require('../models/entidade');

router.get('/registar', function(req, res) {
    res.render('users/registar', {title: "Registo"});
});

router.get('/login', function(req, res) {
    res.render('users/login', {title: "Login"});
});

router.get('/perfil', Auth.isLoggedIn, function(req, res) {
    res.render('users/perfil', {title: "Perfil"});
});

router.get('/listagem', Auth.isLoggedIn, function(req, res) {
    res.render('users/listagem', {title: "Listagem de utilizadores"});
});

router.get('/pedido_submetido/:id', Auth.isLoggedIn, function(req, res) {
    res.render('users/pedido_submetido', {title: "Pedido submetido"});
});

router.get('/listagem/:id', Auth.isLoggedIn, function(req, res) {
    User.getUserById(req.params.id, function(err, user){
		if (err) {	
			throw err;
		} else {
            res.render('users/listagem_user', {utilizador:user, title: "Perfil utilizador"});
        }
	});
});

router.get('/editar/:id', Auth.isLoggedIn, function(req, res) {
    User.getUserById(req.params.id, function(err, user){
		if (err) {	
			throw err;
		} else {
            res.render('users/editar', { utilizador:user, title: "Edição utilizador"});
        }
	});
});

router.get('/desativar/:id', Auth.isLoggedIn, function(req, res) {
    User.getUserById(req.params.id, function(err, user){
		if (err) {	
			throw err;
		} else {
            return res.send('TODO')
        }
	});
});

router.get('/remover/:id', Auth.isLoggedIn, function(req, res) {
    User.getUserById(req.params.id, function(err, user){
		if (err) {	
			throw err;
		} else {
            return res.send('TODO')
        }
	});
});

// Entidade do utilizador autenticado
router.get('/entidade', Auth.isLoggedInAPI, function (req, res) {
    Entidade.getEntidadeByRepresentante(req.user.email, function(err, entity){
        if (err) {
            console.log(err);
            res.send("Ocorreu um erro!");    
        }
        else if(!entity) {
            res.send("Sem entidade relacionada!"); 
        }
        else{
            res.send(entity.nome);
        }
    });
});

//Atualizar nivel de utilizador
router.post('/updateLevel/', Auth.isLoggedIn, function(req, res) {
    User.getUserById(req.body.id, function(err, user){
		if (err) {	
			throw err;
		} else {
            user.level = req.body.Level;
            user.save(function(err) {
                if (err) {
                    throw err;
                } else {
                    return res.redirect('back');
                }
            });
        }
    });
});

// Guardar trabalho
router.put('/save/:type', Auth.isLoggedInAPI, function (req, res) {
    User.getUserById(req.user._id, function(err, user){

		if (err) {	
			throw err;
		}
		else if (!user) {
			return done(null, false, { message: 'Ocorreu um erro ao guardar a informação' });
		}
		else {
            user.savedStates[req.params.type]=req.body;

            user.save(function(err,updatedUser){
                if(err) {	
                    throw err;
                }
                res.send(updatedUser.savedStates[req.params.type]);
            });
        }
	});
});

// Novo pedido
router.post('/pedido', Auth.isLoggedInAPI, function (req, res) {
    var dataObj= req.body;
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();

    Pedido.getCountPedidos(function(err, count){
        if (err) {
            console.log(err);
            req.send("Ocorreu um erro!");    
        }
        else {
            var num = count+1+"-"+yyyy;
            var entity;

            Entidade.getEntidadeByRepresentante(req.user.email, function(err, ent){
                if (err) {
                    console.log(err);
                    req.send("Ocorreu um erro!");    
                }
                else{
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
});

// Dados de um pedido
router.get('/pedido/:num', function (req, res) {
    Pedido.getPedidoByNumber(req.params.num, function(err, request){
        if (err) {
            console.log(err);
            req.send("Ocorreu um erro!");    
        }
        else if (!request){
            req.send("Não existe um pedido com esse número!");   
        }
        else{
            var dataObj = {
                num: request.numero,
                tipo: request.tipo,
                desc: request.descricao,
                data: request.data
            }

            res.send(dataObj);
        }
    });
});

// Carregar trabalho
router.get('/load/:type', Auth.isLoggedInAPI, function (req, res) {
    res.send(req.user.savedStates[req.params.type]);
});

module.exports = router;
