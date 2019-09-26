var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
var secretKey = require('./../../config/app');
var Auth = require('../../controllers/auth');
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

router.get('/listarToken/:id', async function(req,res){
    await jwt.verify(req.params.id, secretKey.key, async function(err, decoded){
        if(!err){
            await Chaves.listarPorId(decoded.id,function(err, result){
                if(err){
                    res.send(err);
                }else{
                    res.send(result);
                }
            });
        }else{
            res.send(err);
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

router.put('/desativar', function(req, res) {
    Chaves.desativar(req.body.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API desativada com sucesso!');
        }
    });
});

router.put('/ativar', function(req, res) {
    Chaves.ativar(req.body.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API ativada com sucesso!');
        }
    });
});

router.delete('/eliminar', function(req, res) {
    Chaves.eliminar(req.body.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API eliminada com sucesso!');
        }
    });
});

router.put('/renovar', function(req, res) {
    Chaves.listarPorEmail(req.body.email, function(err, chave){
        if(err || !chave){
            res.send("Não existe nenhuma chave API associada neste email!");
        }else{
            var token = Auth.generateTokenEmail();
            Mailer.sendEmailRenovacaoAPI(chave.contactInfo, req.body.url.split('/renovar')[0]+'/alteracaoChaveApi?jwt='+token);
            res.send('Email enviado com sucesso!');
        }
    });
});

router.put('/atualizarChave', function(req, res) {
    Chaves.renovar(req.body.id, function(err, chave){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            Mailer.sendEmailRegistoAPI(chave.contactInfo, chave.key);
            res.send('Chave API renovada com sucesso!');
        }
    });
});

router.put('/atualizarMultiplos', function (req, res) {
    Chaves.atualizarMultiplosCampos(req.body.id, req.body.name, req.body.contactInfo, req.body.entity, function (err, cb) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        else {
            res.send('Chave API atualizada com sucesso!')
        }
    });
});

module.exports = router;
