var Auth = require("../../controllers/auth.js");
var Entidades = require("../../controllers/api/entidades.js");
var url = require("url");

var express = require("express");
var router = express.Router();

// Lista todas as entidades: id, sigla, designacao, internacional
router.get("/", Auth.isLoggedInKey, async (req, res, next) => {
  var validKeys = ["sigla", "designacao", "internacional", "sioe", "estado"];
  var queryData = url.parse(req.url, true).query;

  var ents = queryData.ents
    ? `?uri IN (${queryData.ents
        .split(",")
        .map(t => `clav:${t}`)
        .join(",")})`
    : "True";
  var filtro = Object.entries(queryData)
    .filter(([k, v]) => v !== undefined && validKeys.includes(k))
    .map(([k, v]) => `?${k} = "${v}"`)
    .concat([ents])
    .join(" && ");

  // api/entidades?processos=com
  if (queryData.processos && queryData.processos == "com") {
    try {
      res.locals.dados = await Entidades.listarComPNs(filtro);

      if (req.query.info == "completa") {
        await Entidades.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "entidades";
      next();
    } catch (erro) {
      res
        .status(500)
        .send(`Erro na listagem das entidades com PNs associados: ${erro}`);
    }
  }
  // api/entidades?processos=sem
  else if (queryData.processos && queryData.processos == "sem") {
    try {
      res.locals.dados = await Entidades.listarSemPNs(filtro);

      if (req.query.info == "completa") {
        await Entidades.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "entidades";
      next();
    } catch (erro) {
      res
        .status(500)
        .send(`Erro na listagem das entidades sem PNs associados: ${erro}`);
    }
  } else {
    try {
      res.locals.dados = await Entidades.listar(filtro);

      if (req.query.info == "completa") {
        await Entidades.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "entidades";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem das entidades: ${erro}`);
    }
  }
});

// Verifica se a sigla já existe numa entidade
router.get("/sigla", Auth.isLoggedInKey, (req, res) => {
  Entidades.existeSigla(req.query.valor)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na verificação da sigla: ${err}`));
});

// Verifica se a designação já existe numa entidade
router.get("/designacao", Auth.isLoggedInKey, (req, res) => {
  Entidades.existeDesignacao(req.query.valor)
    .then(dados => res.jsonp(dados))
    .catch(err =>
      res.status(500).send(`Erro na verificação da designação: ${err}`)
    );
});

// Consulta de uma entidade: sigla, designacao, estado, internacional
router.get("/:id", Auth.isLoggedInKey, async (req, res, next) => {
  try {
    res.locals.dados = await Entidades.consultar(req.params.id);

    if (req.query.info == "completa") {
      await Entidades.moreInfo(res.locals.dados);
    }

    res.locals.tipo = "entidade";
    res.locals.dados
      ? next()
      : res.status(404).send(`Erro. A entidade '${req.params.id}' não existe`);
  } catch (erro) {
    res
      .status(500)
      .send(`Erro na consulta da entidade '${req.params.id}': ${erro}`);
  }
});

// Lista as tipologias a que uma entidade pertence: id, sigla, designacao
router.get("/:id/tipologias", Auth.isLoggedInKey, (req, res) => {
  return Entidades.tipologias(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro =>
      res
        .status(500)
        .send(
          `Erro na consulta das tipologias a que '${req.params.id}' pertence: ${erro}`
        )
    );
});

// Lista os processos em que uma entidade intervem como dono
router.get("/:id/intervencao/dono", Auth.isLoggedInKey, (req, res) => {
  return Entidades.dono(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro =>
      res
        .status(500)
        .send(
          `Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`
        )
    );
});

// Lista os processos em que uma entidade intervem como participante
router.get("/:id/intervencao/participante", Auth.isLoggedInKey, (req, res) => {
  return Entidades.participante(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro =>
      res
        .status(500)
        .send(
          `Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`
        )
    );
});

// Insere uma entidade na BD
router.post("/", Auth.isLoggedInUser, Auth.checkLevel(4), (req, res) => {
  if (req.body && req.body.sigla && req.body.estado && req.body.designacao) {
    Entidades.criar(req.body)
      .then(dados => res.jsonp(dados))
      .catch(err =>
        res.status(500).send(`Erro na inserção de uma entidade: ${err}`)
      );
  } else {
    res
      .status(500)
      .send(
        "O seu pedido não possui todos os parâmetros necessários (sigla, estado ou designacao)."
      );
  }
});

// Extinguir uma entidade na BD
router.put(
  "/:id/extinguir",
  Auth.isLoggedInUser,
  Auth.checkLevel(4),
  (req, res) => {
    if (req.body && req.body.dataExtincao) {
      Entidades.extinguir(req.params.id, req.body.dataExtincao)
        .then(dados => res.jsonp(dados))
        .catch(err =>
          res.status(500).send(`Erro na inserção de uma entidade: ${err}`)
        );
    } else {
      res
        .status(500)
        .send(
          "O seu pedido não possui o parâmetro necessário, a data de extinção da entidade (dataExtincao)."
        );
    }
  }
);

module.exports = router;
