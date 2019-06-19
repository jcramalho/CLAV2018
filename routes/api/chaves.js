var express = require('express');
var router = express.Router();
var Chaves = require('../../controllers/api/chaves');
var Mailer = require('../../controllers/api/mailer');

router.get('/listagem', (req, res) => {
    Chaves.listar(function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.send(result);
        }
    });
});

router.post('/registar', (req, res) => {
    Chaves.listarPorEmail(req.body.email, function (err, chave) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        if (!chave) {
            Chaves.criarChave(req.body.name, req.body.email, req.body.entidade, function(err, result){
                if(err){
                    return res.status(500).send(`Erro: ${err}`);
                }else{
                    Mailer.sendEmailRegistoAPI(req.body.email, result.ops[0].key);
                    res.send('Chave API registada com sucesso!');
                }
            });
        }else{
            res.send('Email já em uso!');
        }
    });
});

router.post('/desativar', function(req, res) {
    Chaves.desativar(req.body.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API desativada com sucesso!');
        }
    });
});

router.post('/ativar', function(req, res) {
    Chaves.ativar(req.body.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API ativada com sucesso!');
        }
    });
});

router.post('/eliminar', function(req, res) {
    Chaves.eliminar(req.body.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API eliminada com sucesso!');
        }
    });
});

router.post('/atualizarMultiplos', function (req, res) {
    Chaves.atualizarMultiplosCampos(req.body.id, req.body.name, req.body.contactInfo, req.body.entity, function (err, cb) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        else {
            res.send('Chave API atualizada com sucesso!')
        }
    });
});

module.exports = router;