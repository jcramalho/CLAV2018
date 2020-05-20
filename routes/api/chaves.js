var express = require("express");
var router = express.Router();
var interfaceHosts = require("./../../config/database").interfaceHosts;
var Chaves = require("../../controllers/api/chaves");
var Auth = require('../../controllers/auth');
var Mailer = require("../../controllers/api/mailer");
const { param, header, body, query, validationResult } = require('express-validator');
const { existe, verificaExisteEnt } = require('../validation')

router.get("/", (req, res) => {
  Chaves.listar(function(err, result) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível obter as Chaves API!");
    } else {
      res.send(result);
    }
  });
});

router.get("/clavToken", [
    header('origin', "Não pode fazer o pedido desse domínio!")
        .custom(value => interfaceHosts.includes(value))
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }
  
  Chaves.listarPorEmail("interface_clav@dglab.pt", async function(err, chave) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Erro ao obter o token da CLAV!")
    } else if (!chave) {
      Chaves.criarChave(
        "clav_interface",
        "interface_clav@dglab.pt",
        "ent_DGLAB",
        function(err, chave) {
          if (err) {
            //res.status(500).send(err);
            res.status(500).send("Erro ao obter o token da CLAV!")
          } else {
            res.send({ apikey: chave.key });
          }
        }
      );
    } else {
      try{
        var decoded = await Auth.verifyTokenKey(chave.key)
        res.send({ apikey: chave.key });
      }catch(err){
        Chaves.renovar(chave.id, function(err, chave) {
          if (err) {
            //res.status(500).send(err);
            res.status(500).send("Erro ao obter o token da CLAV!")
          } else {
            res.send({ apikey: chave.key });
          }
        });
      }
    }
  });
});

router.get("/:id", [
    param('id', "A chave API não possui um formato válido").isJWT()
], async function(req, res) {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  try {
    var decoded = await Auth.verifyTokenKey(req.params.id)
    await Chaves.listarPorId(decoded.id, function(err, result) {
      if (err) {
        //res.status(403).send(err);
        res.status(500).send("Não foi possível obter a Chave API!")
      } else {
        res.send(result);
      }
    });
  }catch(err){
    //res.status(403).send(err);
    res.status(500).send("Não foi possível obter a Chave API!")
  }
});

router.post("/", [
    existe('body', 'name'),
    body('email', "Email inválido").isEmail(),
    verificaExisteEnt('body', 'entidade')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Chaves.listarPorEmail(req.body.email, function(err, chave) {
    if (err) {
      //return res.status(500).send(`Erro: ${err}`);
      return res.status(500).send("Não foi possível registar a Chave API!");
    }

    if (!chave) {
      Chaves.criarChave(
        req.body.name,
        req.body.email,
        req.body.entidade,
        function(err, result) {
          if (err) {
            //return res.status(500).send(`Erro: ${err}`);
            return res.status(500).send("Não foi possível registar a Chave API!");
          } else {
            Mailer.sendEmailRegistoAPI(req.body.email, result.ops[0].key);
            res.send("Chave API registada com sucesso!");
          }
        }
      );
    } else {
      //Email já em uso
      //Por forma a não divulgar que emails estão já usados, será devolvido que foi enviado um email com sucesso
      res.send("Chave API registada com sucesso!");
    }
  });
});

router.put("/renovar", [
    query('email', "Email inválido").isEmail()
], function(req, res) {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Chaves.listarPorEmail(req.query.email, (err, chave) => {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível renovar a Chave API!");
    } else {
      if (!chave) {
        //Chave API não encontrada (404)
        //Por forma a não divulgar que emails estão já usados
        res.status(500).send("Não foi possível renovar a Chave API!");
      } else {
        Chaves.renovar(chave._id, function(err, chaveRen) {
          if (err) {
            //res.status(500).send(`Erro: ${err}`);
            res.status(500).send(`Não foi possível renovar a Chave API!`);
          } else {
            res.jsonp({ apikey: chaveRen.key });
          }
        });
      }
    }
  });
});

router.put("/:id/desativar", [
    param('id', "Formato do id inválido").isMongoId()
], function(req, res) {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Chaves.desativar(req.params.id, function(err, cb) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível desativar a Chave API!");
    } else {
      res.send("Chave API desativada com sucesso!");
    }
  });
});

router.put("/:id/ativar", [
    param('id', "Formato do id inválido").isMongoId()
], function(req, res) {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Chaves.ativar(req.params.id, function(err, cb) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível ativar a Chave API!");
    } else {
      res.send("Chave API ativada com sucesso!");
    }
  });
});

router.delete("/:id", [
    param('id', "Formato do id inválido").isMongoId()
], function(req, res) {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Chaves.eliminar(req.params.id, function(err, cb) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível eliminar a Chave API!");
    } else {
      res.send("Chave API eliminada com sucesso!");
    }
  });
});

router.put("/:id/atualizar", [
    param('id', "Formato do id inválido").isMongoId(),
    existe('body', 'name'),
    body('contactInfo', "Email inválido").isEmail(),
    verificaExisteEnt('body', 'entity')
], function(req, res) {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Chaves.listarPorEmail(req.body.email, function(err, chave) {
    if (chave && req.params.id != chave._id) {
      res.status(500).send("Não foi possível atualizar a Chave API! Já existe uma chave API registada com esse email!");
    } else {
      Chaves.atualizarMultiplosCampos(
        req.params.id,
        req.body.name,
        req.body.contactInfo,
        req.body.entity,
        function(err, cb) {
          if (err) {
            //res.status(500).send(`Erro: ${err}`);
            res.status(500).send("Não foi possível atualizar a Chave API!");
          } else {
            res.send("Chave API atualizada com sucesso!");
          }
        }
      );
    }
  });
});

module.exports = router;
