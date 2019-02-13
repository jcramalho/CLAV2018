var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
var Auth = require('../controllers/auth.js');
var Key = require('./../models/keys');
var secretKey = require('./../config/app')
var ApiKey = require('./../config/api')

router.get('/pedidos', Auth.isLoggedIn, function(req, res) {
	res.render('admin/gestao_pedidos', {title: "Gestão de Pedidos"});
});

router.get('/nova_chave', Auth.isLoggedIn, function(req, res) {
	res.render('admin/chave_api', {title: "Registo nova chave API"});
});

router.get('/listagem_chaves', Auth.isLoggedIn, function(req, res) {
	res.render('admin/listagem_chaves', {title: "Listagem chaves API"});
});

router.get('/listagem_chaves/:id', Auth.isLoggedIn, function(req, res) {
    Key.findById(req.params.id, function(err, key){
		if (err) {	
			throw err;
		} else {
            res.render('admin/info_chave', { key:key, title: "Informação chave API"});
        }
	});
});

router.post('/criarChave', Auth.isLoggedIn, function (req, res) {
    var token = jwt.sign({}, secretKey.key, {
        expiresIn: '30d'
    });

    var newKey = new Key({
        key: token,
		nCalls: 0,
		lastUsed: null,
		created: Date.now()
    });

	Key.collection.insert(newKey, function(err, docs) {
		if (err) {
			req.flash('error_msg', 'Ocorreu um erro ao criar a chave API.');
		    res.redirect('admin/chave_api', {title: "Registo nova chave API"});
		} else {
			res.render('admin/chave_api', {title: "Registo nova chave API", flag:true, key:token});
		}
	});
});

router.get('/desativar/:id', Auth.isLoggedIn, function(req, res) {
    Key.findById(req.params.id, function(err, key){
        if (err) {	
            throw err;
        } else {
			if(ApiKey!=key.key){
				key.active = false;
				key.save(function(err) {
					if (err) {
						throw err;
					} else {
						req.flash('success_msg', 'Chave API desativada com sucesso.');
						res.redirect('/gestao/listagem_chaves');
					}
				});
			}else{
				req.flash('warn_msg', 'Não pode desativar a sua própria chave API.');
				res.redirect('back');
			}
		}
    });
});

router.get('/ativar/:id', Auth.isLoggedIn, function(req, res) {
    Key.findById(req.params.id, function(err, key){
        if (err) {	
            throw err;
        } else {
			key.active = true;
			key.save(function(err) {
				if (err) {
					throw err;
				} else {
					req.flash('success_msg', 'Chave API reativada com sucesso.');
					res.redirect('/gestao/listagem_chaves');
				}
			});
		}
    });
});

router.get('/eliminar/:id', Auth.isLoggedIn, function(req, res) {
	Key.findByIdAndRemove(req.params.id, function(err, key){
		if(err){
			throw err;
		}else{
			req.flash('success_msg', 'Chave API eliminada com sucesso.');
			res.redirect('/gestao/listagem_chaves');
		}
	});
});

module.exports = router;
