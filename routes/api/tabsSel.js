var Auth = require("../../controllers/auth.js");
var SelTabs = require("../../controllers/api/tabsSel.js");
var Users = require("../../controllers/api/users.js");

const Excel = require("exceljs/modern.nodejs");
var formidable = require("formidable");
var express = require("express");
var router = express.Router();

const { validationResult } = require("express-validator");
const { existe, verificaTSId } = require("../validation");

router.get("/", function (req, res) {
  SelTabs.list()
    .then((list) => res.send(list))
    .catch((err) => res.status(500).json(`Erro ao obter TSs: ${err}`));
});

//router.get('/skeleton', function (req, res) {
//    SelTabs.skeleton()
//        .then( tsSkeleton => res.send(tsSkeleton))
//        .catch(err => res.status(500).json(`Erro ao obter skeleton: ${err}`))
//})

router.get(
  "/:id/classes",
  [verificaTSId("param", "id")],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    }

    SelTabs.listClasses(req.params.id)
      .then((list) => res.send(list))
      .catch((err) =>
        res.status(500).json(`Erro ao obter classes de TS: ${err}`)
      );
  }
);

router.get("/:id", [verificaTSId("param", "id")], function (
  req,
  res
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.array());
  }

    SelTabs.consultar(req.params.id)
      .then((result) => res.send(result))
      .catch((err) => res.status(500).json(`Erro ao obter TS: ${err}`));
  }
);

router.post(
  "/",
  [existe("body", "tabela"),existe("body","leg")],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    }

    SelTabs.adicionar(req.body.tabela, req.body.leg)
      .then((dados) => res.jsonp(dados))
      .catch((err) =>
        res.status(500).send(`Erro na criação de tabela de seleção: ${err}`)
      );
  }
);

router.post(
  "/importar",
  async function (req, res) {
    var form = new formidable.IncomingForm();

    Users.getUserById(req.user.id, function (err, user) {
      if (err) {
        res
          .status(500)
          .json(
            `Erro ao importar CSV/Excel, não foi possível obter o utilizador: ${err}`
          );
      } else {
        form.parse(req, async (error, fields, formData) => {
          if (!error) {
            fields.multImport = fields.multImport === "true";
            if (
              formData.file &&
              formData.file.type &&
              formData.file.path &&
              ((fields.entidades_ts && fields.designacao) ||
                fields.multImport) &&
              fields.tipo_ts &&
              fields.fonteL
            ) {
              var workbook = new Excel.Workbook();

              if (!fields.multImport && !fields.entidades_ts) {
                res
                  .status(500)
                  .json(
                    `Erro ao importar CSV: Não foram escolhidas entidades para a TS. Necessita de ter um array denominado entidades_ts com pelo menos uma sigla de uma entidade da TS.`
                  );
              }

              if (formData.file.type == "text/csv") {
                var possibleDelimiters = [",", ";", "\t", "|"];
                var i = 0;
                var len = possibleDelimiters.length;
                var parsed = false;

                var options = {
                  //Substitui função por forma a não realizar parse de datas, igual a usada pelo exceljs, caso vazio devolve null, no resto devolve string
                  map: (value, index) => {
                    if (value === "") {
                      return null;
                    }

                    return value;
                  },
                };

                while (!parsed) {
                  try {
                    //tenta as várias hipóteses de delimitadores do CSV
                    options.delimiter = possibleDelimiters[i];
                    var worksheet = await workbook.csv.readFile(
                      formData.file.path,
                      options
                    );
                    parsed = true;
                  } catch (erro) {
                    if (++i == len) {
                      parsed = true;
                      res
                        .status(500)
                        .json(
                          `Erro ao importar CSV: Não foi possível fazer parsing do ficheiro.\nOs delimitadores podem ser: , ou ; ou \\t ou |.\nPara além disso o quote e o escape são realizados através de ".\nPor fim, o encoding do ficheiro tem de ser UTF-8.`
                        );
                    }
                  }
                }

                if (i < len) {
                  SelTabs.criarPedidoDoCSV(
                    workbook,
                    user.email,
                    req.user.entidade,
                    !fields.multImport ? fields.entidades_ts : "",
                    !fields.multImport ? fields.designacao : "",
                    fields.tipo_ts,
                    fields.fonteL,
                    formData.file.name,
                    fields.multImport
                  )
                    .then((codigoPedido) => res.json(codigoPedido))
                    .catch((erro) =>
                      res.status(500).json(`Erro ao importar CSV: ${erro}`)
                    );
                }
              } else if (
                formData.file.type ==
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              ) {
                workbook.xlsx
                  .readFile(formData.file.path)
                  .then(function () {
                    SelTabs.criarPedidoDoCSV(
                      workbook,
                      user.email,
                      req.user.entidade,
                      !fields.multImport ? fields.entidades_ts : "",
                      !fields.multImport ? fields.designacao : "",
                      fields.tipo_ts,
                      fields.fonteL,
                      formData.file.name,
                      fields.multImport
                    )
                      .then((dados) => res.json(dados))
                      .catch((erro) => {
                        if (erro.length > 0 || erro.entidades) {
                          res.status(500).json(erro);
                        } else {
                          res
                            .status(500)
                            .json(`Erro ao importar Excel: ${erro}`);
                        }
                      });
                  })
                  .catch((erro) =>
                    res.status(500).json(`Erro ao importar Excel: ${erro}`)
                  );
              } else {
                res
                  .status(415)
                  .json(
                    `Erro ao importar CSV/Excel: o ficheiro tem de estar no formato CSV ou Excel (.xlsx)`
                  );
              }
            } else {
              res
                .status(500)
                .json(
                  `Erro ao importar CSV/Excel: O FormData deve possuir quatro campos: um ficheiro em file, o tipo de TS em tipo_ts, a designação em designacao e a sigla da entidade(s) da TS entidade em entidades_ts.`
                );
            }
          } else {
            res.status(500).json(`Erro ao importar CSV/Excel: ${error}`);
          }
        });
      }
    });
  }
);

module.exports = router;
