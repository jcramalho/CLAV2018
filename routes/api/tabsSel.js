var Auth = require("../../controllers/auth.js");
var SelTabs = require("../../controllers/api/tabsSel.js");
var Users = require("../../controllers/api/users.js");

const Excel = require("exceljs/modern.nodejs");
var formidable = require("formidable");
var express = require("express");
var router = express.Router();

const { validationResult } = require("express-validator");
const { existe, verificaTSId } = require("../validation");

router.get("/", Auth.isLoggedInKey, function (req, res) {
  SelTabs.list()
    .then((list) => res.send(list))
    .catch((err) => res.status(500).json(`Erro ao obter TSs: ${err}`));
});

//router.get('/skeleton', Auth.isLoggedInKey, function (req, res) {
//    SelTabs.skeleton()
//        .then( tsSkeleton => res.send(tsSkeleton))
//        .catch(err => res.status(500).json(`Erro ao obter skeleton: ${err}`))
//})

router.get(
  "/:id/classes",
  Auth.isLoggedInKey,
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

router.get(
  "/:id",
  Auth.isLoggedInKey,
  [verificaTSId("param", "id")],
  function (req, res) {
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
  Auth.isLoggedInUser,
  Auth.checkLevel([5, 6, 7]),
  [existe("body", "tabela"), existe("body", "leg")],
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

validaEstruturaCSV = async function(req, res, next){
  console.log("Validação Estrutural.")
  var form = new formidable.IncomingForm()
  form.parse(req, async (error, fields, formData) => {
    if (error)
      res.status(500).send(`Erro ao importar Lista de Processos: ${error}`);
    else if (!formData.file || !formData.file.path)
      res.status(501).send(`Erro ao importar Lista de Processos: o ficheiro a importar tem de vir no pedido. `);
    else if (formData.file.type == "application/vnd.ms-excel") {
      var file = fs.readFileSync(formData.file.path, 'utf8')
      Papa.parse(file, {
        header: true,
        transformHeader:function(h) {
          return h.trim();
        },
        complete: async function(results) {
          var f1 = results.data
          var linha = results.data[0]
          var mensagens = []
          if(!linha.hasOwnProperty('codigo')) mensagens.push("Não foi possível importar a lista de processos. Coluna codigo inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('dono')) mensagens.push("Não foi possível importar a lista de processos. Coluna dono inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          if(!linha.hasOwnProperty('participante')) mensagens.push("Não foi possível importar a lista de processos. Coluna participante inexistente. Verifique o seu preenchimento na seguinte linha: 0 %%%");
          
          if (mensagens.length > 0)
            return res.status(502).jsonp(mensagens );
          else {
            console.log(fields)
            console.log(JSON.stringify(f1))
            //req.doc = []
            //req.doc.push(fields)
            //req.doc.push(f1)
            next()
          }
        }
      })
    }
  })
}

router.post(
  "/importarProcessos", 
  Auth.isLoggedInUser,
  Auth.checkLevel([4, 5, 6, 7]),
  validaEstruturaCSV,
  (req, res) => {
    return res.status(500).jsonp(req.doc)
  }
)

router.post(
  "/importar",
  Auth.isLoggedInUser,
  Auth.checkLevel([4, 5, 6, 7]),
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
              ((fields.entidade_ts && fields.designacao) ||
                fields.multImport) &&
              fields.tipo_ts &&
              fields.fonteL
            ) {
              var workbook = new Excel.Workbook();

              if (!fields.multImport && !fields.entidade_ts) {
                res
                  .status(501)
                  .json(
                    `Erro ao importar CSV: Não foram escolhidas entidades para a TS. Necessita de ter um array denominado entidade_ts com pelo menos uma sigla de uma entidade da TS.`
                  );
              }

              if (formData.file.type == "text/csv") {
                var possibleDelimiters = [",", ";"];
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
                        .status(502)
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
                    !fields.multImport ? fields.entidade_ts : "",
                    !fields.multImport ? fields.designacao : "",
                    fields.tipo_ts,
                    fields.fonteL,
                    formData.file.name,
                    fields.multImport
                  )
                    .then((codigoPedido) => res.json(codigoPedido))
                    .catch((erro) =>
                      res.status(503).json(`Erro ao importar CSV: ${erro}`)
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
                      !fields.multImport ? fields.entidade_ts : "",
                      !fields.multImport ? fields.designacao : "",
                      fields.tipo_ts,
                      fields.fonteL,
                      formData.file.name,
                      fields.multImport
                    )
                      .then((dados) => res.json(dados))
                      .catch((erro) => {
                        if (erro.length > 0 || erro.entidades) {
                          res.status(504).json(erro);
                        } else {
                          res
                            .status(505)
                            .json(`Erro ao importar Excel: ${erro}`);
                        }
                      });
                  })
                  .catch((erro) =>
                    res.status(506).json(`Erro ao importar Excel: ${erro}`)
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
                .status(507)
                .json(
                  `Erro ao importar CSV/Excel: O FormData deve possuir quatro campos: um ficheiro em file, o tipo de TS em tipo_ts, a designação em designacao e a sigla da entidade(s) da TS entidade em entidade_ts.`
                );
            }
          } else {
            res.status(508).json(`Erro ao importar CSV/Excel: ${error}`);
          }
        });
      }
    });
  }
);

router.delete(
  "/:id",
  Auth.isLoggedInUser,
  Auth.checkLevel([4, 5, 6, 7]),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    }
    SelTabs.deleteTS(req.params.id, "leg_" + req.params.id.split("_leg_")[1])
      .then((dados) => res.jsonp(dados))
      .catch((err) =>
        res.status(500).send(`Erro na criação de tabela de seleção: ${err}`)
      );
  }
);

module.exports = router;
