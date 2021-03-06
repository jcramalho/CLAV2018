var Auth = require("../../controllers/auth.js");
var AutosEliminacao = require("../../controllers/api/autosEliminacao.js");
var User = require("../../controllers/api/users.js");
var excel2Json = require("../../controllers/conversor/xslx2json");
var xml2Json = require("../../controllers/conversor/aeXml2Json");
var xml = require("libxmljs");
var xml2js = require("xml2js");
var fs = require("fs");

const { validationResult } = require("express-validator");
const {
  existe,
  estaEm,
  verificaAEId,
  vcTipoAE,
  vcFonte,
} = require("../validation");

var express = require("express");
var router = express.Router();
var formidable = require("formidable");

router.get("/", Auth.isLoggedInKey, (req, res) => {
  AutosEliminacao.listar()
    .then((dados) => res.jsonp(dados))
    .catch((erro) => res.status(404).jsonp("Erro na listagem dos AE: " + erro));
});

router.get("/:id", Auth.isLoggedInKey, [verificaAEId("param", "id")], function (
  req,
  res
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.array());
  }

  AutosEliminacao.consultar(req.params.id, req.user ? req.user.entidade : null)
    .then((dados) => res.jsonp(dados))
    .catch((erro) =>
      res
        .status(404)
        .jsonp("Erro na consulta do AE " + req.params.id + ": " + erro)
    );
});

//Criar um AE && Importar AE
router.post(
  "/",
  Auth.isLoggedInUser,
  Auth.checkLevel([5, 6, 7]),
  [existe("body", "auto")],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    }

    AutosEliminacao.adicionar(req.body.auto)
      .then((dados) => res.jsonp(dados))
      .catch((err) =>
        res.status(500).send(`Erro na criação de auto de eliminação: ${err}`)
      );
  }
);

//Importar um AE (Inserir ficheiro diretamente pelo Servidor)
router.post(
  "/importar",
  Auth.isLoggedInUser,
  Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]),
  [estaEm("query", "tipo", vcFonte)],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    }

    var form = new formidable.IncomingForm();
    form.parse(req, async (error, fields, formData) => {
      if (error)
        res.status(500).send(`Erro ao importar Auto de Eliminação: ${error}`);
      else if (!formData.file || !formData.file.path)
        res
          .status(500)
          .send(
            `Erro ao importar Auto de Eliminação: É necessário o campo file`
          );
      else if (formData.file.type == "text/xml") {

        var schemaPath = __dirname + "/../../public/schema/autoEliminacao.xsd";
        var schema = fs.readFileSync(schemaPath);
        var xsd = xml.parseXml(schema);
        var doc = fs.readFileSync(formData.file.path);
        var xmlDoc = xml.parseXml(doc);

        if (xmlDoc.validate(xsd)) {
          const parser = new xml2js.Parser();
          parser.parseString(doc, (error, result) => {
            if (error) res.status(500).send("Erro na análise estrutural do ficheiro XML: " + error);
            else {
              User.getUserById(req.user.id, function (err, user) {
                if (err)
                  res
                    .status(500)
                    .json(
                      `Erro na consulta de utilizador para importação do AE: ${err}`
                    );
                else {
                  xml2Json(result.autoEliminação, req.query.tipo)
                    .then((data) => {
                      AutosEliminacao.importar(data.auto, req.query.tipo, user)
                        .then((dados) => {
                          res.jsonp({
                            tipo: dados.tipo,
                            codigoPedido: dados.codigo,
                            mensagem: "Auto de Eliminação importado com sucesso e adicionado aos pedidos com codigo: " + dados.codigo
                          }
                          );
                        })
                        .catch((erro) =>
                          res.status(500).json(`Erro na adição do AE: ${erro}`)
                        );
                    })
                    .catch((err) => res.status(500).send(err));
                }
              });
            }
          });
        } else res.status(500).send(xmlDoc.validationErrors);
      } else
        res
          .status(500)
          .send(
            `Erro ao importar Auto de Eliminação, tipo de ficheiro: ${formData.file.type}`
          );
    });
  }
);

module.exports = router;
