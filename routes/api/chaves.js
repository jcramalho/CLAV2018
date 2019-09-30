var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
var secretKey = require('./../../config/app');
var interfaceHosts = require('./../../config/database').interfaceHosts
var Auth = require('../../controllers/auth');
var Chaves = require('../../controllers/api/chaves');
var Mailer = require('../../controllers/api/mailer');

router.get('/listagem', Auth.isLoggedInUser, Auth.checkLevel(7), (req, res) => {
    Chaves.listar(function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.send(result);
        }
    });
});

router.get('/clavToken', (req, res) => {
    if(interfaceHosts.includes(req.headers.origin)){
        Chaves.listarPorEmail('interface_clav@dglab.pt', function(err, chave){
            if(err){
                res.status(500).send(`Erro: ${err}`);
            }else if(!chave){
                Chaves.criarChave("clav_interface", "interface_clav@dglab.pt", "ent_DGLAB", function(err, chave){
                    if(err){
                        res.status(403).send(err);
                    }else{
                        jwt.verify(chave.key, secretKey.apiKey, function(err, decoded){
                            if(err){
                                res.status(403).send(err);
                            }else{
                                res.send({token: chave.key, exp: decoded.exp})
                            }
                        });
                    }
                })
            }else{
                jwt.verify(chave.key, secretKey.apiKey, function(err, decoded){
                    if(err){
                        res.status(403).send(err);
                    }else{
                        res.send({token: chave.key, exp: decoded.exp})
                    }
                });           
            }
        })
    }else{
        res.status(403).send("Não pode fazer o pedido desse domínio!")
    }
})

router.get('/listarToken/:id', Auth.isLoggedInUser, Auth.checkLevel(7), async function(req,res){
    await jwt.verify(req.params.id, secretKey.apiKey, async function(err, decoded){
        if(!err){
            await Chaves.listarPorId(decoded.id,function(err, result){
                if(err){
                    res.status(403).send(err);
                }else{
                    res.send(result);
                }
            });
        }else{
            res.status(403).send(err);
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

router.put('/desativar/:id', Auth.isLoggedInUser, Auth.checkLevel(7), function(req, res) {
    Chaves.desativar(req.params.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API desativada com sucesso!');
        }
    });
});

router.put('/ativar/:id', Auth.isLoggedInUser, Auth.checkLevel(7), function(req, res) {
    Chaves.ativar(req.params.id, function(err, cb){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            res.send('Chave API ativada com sucesso!');
        }
    });
});

router.delete('/eliminar/:id', Auth.isLoggedInUser, Auth.checkLevel(7), function(req, res) {
    Chaves.eliminar(req.params.id, function(err, cb){
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

router.put('/atualizarChave/:id', function(req, res) {
    Chaves.renovar(req.params.id, function(err, chave){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            Mailer.sendEmailRegistoAPI(chave.contactInfo, chave.key);
            res.send('Chave API renovada com sucesso!');
        }
    });
});

router.put('/atualizarMultiplos/:id', Auth.isLoggedInUser, Auth.checkLevel(7), function (req, res) {
    Chaves.atualizarMultiplosCampos(req.params.id, req.body.name, req.body.contactInfo, req.body.entity, function (err, cb) {
        if (err) 
            return res.status(500).send(`Erro: ${err}`);
        else {
            res.send('Chave API atualizada com sucesso!')
        }
    });
});

module.exports = router;
