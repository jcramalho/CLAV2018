var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
var secretKey = require("./../../config/app");
var interfaceHosts = require("./../../config/database").interfaceHosts;
var Auth = require("../../controllers/auth");
var Chaves = require("../../controllers/api/chaves");
var Mailer = require("../../controllers/api/mailer");

router.get("/", Auth.isLoggedInUser, Auth.checkLevel(6), (req, res) => {
  Chaves.listar(function(err, result) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível obter as Chaves API!");
    } else {
      res.send(result);
    }
  });
});

router.get("/clavToken", (req, res) => {
  if (interfaceHosts.includes(req.headers.origin)) {
    Chaves.listarPorEmail("interface_clav@dglab.pt", function(err, chave) {
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
              jwt.verify(chave.key, secretKey.apiKey, function(err, decoded) {
                if (err) {
                  //res.status(500).send(err);
                  res.status(500).send("Erro ao obter o token da CLAV!")
                } else {
                  res.send({ token: chave.key, exp: decoded.exp });
                }
              });
            }
          }
        );
      } else {
        jwt.verify(chave.key, secretKey.apiKey, function(err, decoded) {
          if (err) {
            Chaves.renovar(chave.id, function(err, chave) {
              if (err) {
                //res.status(500).send(err);
                res.status(500).send("Erro ao obter o token da CLAV!")
              } else {
                jwt.verify(chave.key, secretKey.apiKey, function(err, decoded) {
                  if (err) {
                    //res.status(500).send(err);
                    res.status(500).send("Erro ao obter o token da CLAV!")
                  } else {
                    res.send({ token: chave.key, exp: decoded.exp });
                  }
                });
              }
            });
          } else {
            res.send({ token: chave.key, exp: decoded.exp });
          }
        });
      }
    });
  } else {
    res.status(403).send("Não pode fazer o pedido desse domínio!");
  }
});

router.get("/:id", Auth.isLoggedInUser, Auth.checkLevel(7), async function(
  req,
  res
) {
  await jwt.verify(req.params.id, secretKey.apiKey, async function(
    err,
    decoded
  ) {
    if (!err) {
      await Chaves.listarPorId(decoded.id, function(err, result) {
        if (err) {
          //res.status(403).send(err);
          res.status(500).send("Não foi possível obter a Chave API!")
        } else {
          res.send(result);
        }
      });
    } else {
      //res.status(403).send(err);
      res.status(500).send("Não foi possível obter a Chave API!")
    }
  });
});

router.post("/", (req, res) => {
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

router.put("/renovar", function(req, res) {
  if (req.query.email) {
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
  } else {
    res.status(404).send("Erro: O email é obrigatório");
  }
});

router.put("/:id/desativar", Auth.isLoggedInUser, Auth.checkLevel(7), function(
  req,
  res
) {
  Chaves.desativar(req.params.id, function(err, cb) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível desativar a Chave API!");
    } else {
      res.send("Chave API desativada com sucesso!");
    }
  });
});

router.put("/:id/ativar", Auth.isLoggedInUser, Auth.checkLevel(7), function(
  req,
  res
) {
  Chaves.ativar(req.params.id, function(err, cb) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível ativar a Chave API!");
    } else {
      res.send("Chave API ativada com sucesso!");
    }
  });
});

router.delete("/:id", Auth.isLoggedInUser, Auth.checkLevel(7), function(
  req,
  res
) {
  Chaves.eliminar(req.params.id, function(err, cb) {
    if (err) {
      //res.status(500).send(`Erro: ${err}`);
      res.status(500).send("Não foi possível eliminar a Chave API!");
    } else {
      res.send("Chave API eliminada com sucesso!");
    }
  });
});

router.put("/:id/atualizar", Auth.isLoggedInUser, Auth.checkLevel(7), function(
  req,
  res
) {
  Chaves.listarPorEmail(req.body.contactInfo, function(err, chave) {
    if (chave && req.params.id != chave._id) {
      //Já existe uma chave API registada com esse email
      //Por forma a não divulgar que emails estão já usados
      res.status(500).send("Não foi possível atualizar a Chave API!");
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
