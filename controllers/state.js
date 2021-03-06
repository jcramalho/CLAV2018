var fs = require("fs");

/**
 * Carrega a árvore de classes em estruturas de suporte
 *   - vai permitir acelerar as querys e todas as operações de consulta
 */
var Classes = require("./api/classes.js");
var Legs = require("./api/leg.js");
var Entidades = require("./api/entidades.js");
var NotasAp = require("./api/notasAp.js");
var ExemplosNotasAp = require("./api/exemplosNotasAp.js");
var TermosIndice = require("./api/termosIndice.js");
var TravessiaEspecial = require("./travessiaEspecial.js");

var classTree = [];
var classList = [];
//level 1, 2, 3, 4
var levelClasses = [[], [], [], []];
var classTreeInfo = [];

var notasAplicacao = [];
var exemplosNotasAplicacao = [];
var termosInd = [];

var legislacao = [];

var entidades = [];

// Índice de pesquisa para v-trees:
var indicePesquisa = [];

//reload/reset

exports.reloadLegislacao = async () => {
  console.debug("A carregar a legislação da BD para a cache...");
  legislacao = [];
  legislacao = await loadLegs();
  console.debug("Terminei de carregar a legislação.");
};

exports.reloadEntidades = async () => {
  console.debug("A carregar as entidades da BD para a cache...");
  entidades = [];
  entidades = await loadEntidades();
  console.debug("Terminei de carregar as entidades.");
};

exports.reloadClasses = async () => {
  console.debug("A carregar as Classes da BD para a cache...");
  classes = [];
  classes = await loadClasses();
  classList = [].concat.apply([], levelClasses);

  console.debug("Terminei de carregar as Classes.");

  //Carrega a info completa de todas as classes
  console.debug("A obter a informação completa das classes...");
  classTreeInfo = await loadClassesInfo();
  console.debug("a guardar a informação num ficheiro...");
  fs.writeFileSync(
    "./public/classes/classesInfo.json",
    JSON.stringify(classTreeInfo, null, 4)
  );
  console.debug("Terminei de carregar a informação completa das classes.");
};

exports.reset = async () => {
  try {
    console.debug("A carregar as classes da BD para a cache...");
    classTree = await loadClasses();
    classList = [].concat.apply([], levelClasses);
    console.debug("Terminei de carregar as classes.");

    console.debug(
      "A carregar a informação completa das classes para a cache a partir do ficheiro..."
    );
    classTreeInfo = JSON.parse(
      fs.readFileSync("./public/classes/classesInfo.json")
    );
    console.debug("Terminei de carregar a informação completa das classes.");

    await exports.reloadLegislacao();

    await exports.reloadEntidades();

    console.debug("A criar o índice de pesquisa...");
    indicePesquisa = await criaIndicePesquisa();
    console.debug(
      "Índice de pesquisa criado com " + indicePesquisa.length + " entradas."
    );

    //dicionário da travessia especial
    await TravessiaEspecial.reset();
  } catch (err) {
    throw err;
  }
};

exports.reload = async () => {
  try {
    console.debug("A carregar as classes da BD para a cache...");
    levelClasses = [[], [], [], []];

    notasAplicacao = [];
    exemplosNotasAplicacao = [];
    termosInd = [];

    classTree = await loadClasses();
    classList = [].concat.apply([], levelClasses);
    console.debug("Informação base das classes carregada...");

    await exports.reloadLegislacao();

    await exports.reloadEntidades();

    console.debug("A criar o índice de pesquisa...");
    indicePesquisa = await criaIndicePesquisa();
    console.debug(
      "Índice de pesquisa criado com " + indicePesquisa.length + " entradas."
    );

    //Carrega a info completa de todas as classes
    console.debug("A obter a informação completa das classes...");
    classTreeInfo = await loadClassesInfo();
    console.debug("a guardar a informação num ficheiro...");
    fs.writeFileSync(
      "./public/classes/classesInfo.json",
      JSON.stringify(classTreeInfo, null, 4)
    );
    console.debug("Terminei de carregar a informação completa das classes.");

    //dicionário da travessia especial
    await TravessiaEspecial.reset();
  } catch (err) {
    throw err;
  }
};

//classes

exports.getAllClasses = async () => {
  return classTree;
};
exports.getClassesFlatList = async () => {
  return classList;
};
exports.getLevelClasses = async (nivel) => {
  var ret = [];

  if (nivel >= 1 && nivel <= 4) {
    ret = levelClasses[nivel - 1];
  }

  return ret;
};

exports.getAllClassesInfo = async () => {
  return JSON.parse(JSON.stringify(classTreeInfo));
};

//Devolve a informação das classes da subárvore com raiz na classe com o id 'id'
exports.subarvore = async (id) => {
  var ret = JSON.parse(JSON.stringify(classTreeInfo));

  var codigo = id.split("c")[1];
  codigos = codigo.split(".");
  var nivel = codigos.length;
  var found;

  for (var i = 0; i < nivel; i++) {
    found = false;
    testCodigo = codigos.slice(0, i + 1).join(".");

    for (var j = 0; j < ret.length && !found; j++) {
      if (ret[j].codigo == testCodigo) {
        if (nivel == i + 1) {
          ret = ret[j];
        } else {
          ret = ret[j].filhos;
        }
        found = true;
      }
    }

    if (!found) {
      ret = [];
    }
  }

  return ret;
};

// Verifica a existência do código de uma classe: true == existe, false == não existe
exports.verificaCodigo = async (cod) => {
  var nivel = cod.split(".").length;
  var r = false;

  if (nivel >= 1 && nivel <= 4) {
    r =
      (await levelClasses[nivel - 1].filter((c) => c.codigo == cod).length) !=
      0;
  } else {
    console.log("Classe de nível inexistente: " + cod);
  }

  return r;
};

// Verifica a existência do título de uma classe: true == existe, false == não existe
exports.verificaTitulo = async (titulo) => {
  var r = false;
  r = (await classList.filter((c) => c.titulo == titulo).length) != 0;
  return r;
};

// Verifica a existência duma nota de aplicação: true == existe, false == não existe
exports.verificaNA = async (na) => {
  var r = false;
  r =
    (await notasAplicacao.filter((n) => n.notas.some((nn) => nn === na))
      .length) != 0;
  return r;
};

// Verifica a existência dum exemplo de nota de aplicação: true == existe, false == não existe
exports.verificaExemploNA = async (exemplo) => {
  var r = false;
  r =
    (await exemplosNotasAplicacao.filter((e) =>
      e.exemplos.some((ex) => ex === exemplo)
    ).length) != 0;
  return r;
};

// Verifica a existência dum termo de índice: true == existe, false == não existe
exports.verificaTI = async (ti) => {
  var r = false;
  r =
    (await termosInd.filter((t) => t.termos.some((termo) => termo === ti))
      .length) != 0;
  return r;
};

// Verifica a existência duma nota de aplicação: true == existe, false == não existe (Para casos de criação de TSs)
exports.verificaNATS = async (na, classe) => {
  var r = false;

  r =
    (await notasAplicacao.filter(
      (n) => n.notas.some((naa) => naa === na) && n.classe != classe
    ).length) > 0;
  return r;
};

// Verifica a existência dum exemplo de nota de aplicação: true == existe, false == não existe (Para casos de criação de TSs)
exports.verificaExemploNATS = async (exemplo, classe) => {
  var r = false;
  r =
    (await exemplosNotasAplicacao.filter(
      (e) => e.exemplos.some((ex) => ex === exemplo) && e.classe != classe
    ).length) > 0;
  return r;
};

// Verifica a existência dum termo de índice: true == existe, false == não existe (Para casos de criação de TSs)
exports.verificaTITS = async (ti, classe) => {
  var r = false;
  r =
    (await termosInd.filter(
      (t) => t.termos.some((tt) => tt === ti) && t.classe != classe
    ).length) > 0;
  return r;
};

//Devolve os processos de negócio comuns, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
exports.filterProcessosComuns = (l) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    l[i].filhos = exports.filterProcessosComuns(l[i].filhos);
    //cumpre o filtro ou é de 1º ou 2º nivel ou 3º com filhos
    if (l[i].tipoProc == "Processo Comum" || l[i].filhos.length) {
      ret.push(l[i]);
    }
  }

  return ret;
};

//Devolve os processos de negócio especificos, ou seja, aqueles com :processoTipoVC :vc_processoTipo_pc
exports.filterProcessosEspecificos = (l) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    l[i].filhos = exports.filterProcessosEspecificos(l[i].filhos);
    //cumpre o filtro ou é de 1º ou 2º nivel ou 3º com filhos
    if (l[i].tipoProc == "Processo Específico" || l[i].filhos.length) {
      ret.push(l[i]);
    }
  }

  return ret;
};

//devolve as classes que têm como dona ou participante uma das entidades/tipologias selecionadas
exports.filterEntsTips = (l, ents_tips) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    l[i].filhos = exports.filterEntsTips(l[i].filhos, ents_tips);

    let donos = l[i].donos.filter((d) => ents_tips.includes(d.idDono));
    let parts = l[i].participantes.filter((p) =>
      ents_tips.includes(p.idParticipante)
    );

    if (
      donos.length ||
      parts.length ||
      (l[i].filhos.length && l[i].nivel != 3) ||
      l[i].nivel == 4
    ) {
      ret.push(l[i]);
    }
  }

  return ret;
};

//devolve as classes de um nivel
exports.filterNivel = (l, nivel) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    if (nivel - 1 == 0) {
      //estamos no nivel pretendido
      delete l[i].filhos;
      ret.push(l[i]);
    } else {
      ret = ret.concat(exports.filterNivel(l[i].filhos, nivel - 1));
    }
  }

  return ret;
};

//torna a arvore numa lista
exports.flatArvore = (l) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    if (l[i].filhos) {
      let filhos = exports.flatArvore(l[i].filhos);
      delete l[i].filhos;
      ret.push(l[i]);
      ret = ret.concat(filhos);
    } else {
      ret.push(l[i]);
    }
  }

  return ret;
};

//devolve apenas a info base da classe
exports.filterBaseInfo = (l) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    let c = {
      id: l[i].id,
      codigo: l[i].codigo,
      titulo: l[i].titulo,
      status: l[i].status,
    };

    if (l[i].filhos) {
      c.filhos = exports.filterBaseInfo(l[i].filhos);
    }

    ret.push(c);
  }

  return ret;
};

//devolve apenas a info da classe para o caso do esqueleto
exports.filterEsqueletoInfo = (l) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    let c = {
      codigo: l[i].codigo,
      titulo: l[i].titulo,
      descricao: l[i].descricao,
      status: l[i].status,
      dono: "",
      participante: "",
      pca: l[i].pca.valores,
      df: l[i].df.valor,
    };

    if (l[i].filhos) {
      c.filhos = exports.filterEsqueletoInfo(l[i].filhos);
    }

    ret.push(c);
  }

  return ret;
};

//função auxiliar para filterPreSelecionadoInfo, verifica se as entidades e/ou tipologias são donos
function saoDonos(donos, ents_tips) {
  let ret = [];

  for (let ent_tip of ents_tips) {
    let eDono =
      donos.filter((e) => e.idDono == ent_tip).length > 0 ? "Sim" : "Não";
    ret.push(eDono);
  }

  return ret;
}

//função auxiliar para filterPreSelecionadoInfo, verifica se as entidades e/ou tipologias são donos
function saoDonosSigla(donos, ents_tips) {
  let ret = [];

  for (let ent_tip of ents_tips) {
    if (donos.filter((e) => e.idDono == ent_tip).length > 0) {
      ret.push(ent_tip.split(/ent_|tip_/)[1]);
    }
  }

  return ret;
}

////função auxiliar para filterPreSelecionadoInfo, verifica se as entidades e/ou tipologias são participantes, devolvendo o tipo de participação
function saoParticipantes(participantes, ents_tips) {
  let ret = [];

  for (let ent_tip of ents_tips) {
    let ePart = "Não";

    for (let i = 0; i < participantes.length && ePart == "Não"; i++) {
      if (participantes[i].idParticipante == ent_tip) {
        ePart = participantes[i].participLabel;
      }
    }

    ret.push(ePart);
  }

  return ret;
}

////função auxiliar para filterPreSelecionadoInfo, verifica se as entidades e/ou tipologias são participantes, devolvendo o tipo de participação
function saoParticipantesSigla(participantes, ents_tips) {
  let siglas = [];
  let parts = [];

  for (let ent_tip of ents_tips) {
    for (let i = 0; i < participantes.length; i++) {
      if (participantes[i].idParticipante == ent_tip) {
        siglas.push(ent_tip.split(/ent_|tip_/)[1]);
        parts.push(participantes[i].participLabel);
      }
    }
  }

  return [siglas, parts];
}

//devolve apenas a info da classe para o caso do pre-selecionados
exports.filterPreSelecionadoInfo = (l, ents_tips) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    let c = {
      codigo: l[i].codigo,
      titulo: l[i].titulo,
      descricao: l[i].descricao,
      status: l[i].status,
      pca: l[i].pca.valores,
      formaContagem: l[i].pca.formaContagem,
      df: l[i].df.valor,
    };

    if (l[i].nivel == 3) {
      if (ents_tips.length > 1) {
        c.dono = saoDonosSigla(l[i].donos, ents_tips);
        let aux = saoParticipantesSigla(l[i].participantes, ents_tips);
        c.participante = aux[0];
        c.tipo_participacao = aux[1];
      } else {
        c.dono = saoDonos(l[i].donos, ents_tips);
        c.participante = saoParticipantes(l[i].participantes, ents_tips);
      }
    } else {
      c.dono = [];
      c.participante = [];

      if (ents_tips.length > 1) {
        c.tipo_participacao = [];
      }
    }

    if (l[i].filhos) {
      c.filhos = exports.filterPreSelecionadoInfo(l[i].filhos, ents_tips);
    }

    ret.push(c);
  }

  return ret;
};

//Função auxiliar para filterPesquisaInfo, devolve defaultValue se o objero for null, undefined ou vazio
function ternaryOp(obj, defaultValue) {
  return obj ? obj : defaultValue;
}

//Função auxiliar para filterPesquisaInfo, obtém o termo 'termo' de cada objeto da lista e realiza depois o join com " ". Caso a lista seja null, undefined ou vazia devolve []
function mapJoin(list, term) {
  return list ? list.map((e) => e[term]).join(" ") : [];
}

//Função auxiliar para filterPesquisaInfo, obtém o termo 'termo' de cada objeto da lista. Caso a lista seja null, undefined ou vazia devolve []
function ternaryMap(list, term) {
  return list ? list.map((e) => e[term]) : [];
}

//devolve apenas a info da classe para o caso da pesquisa avançada
exports.filterPesquisaInfo = (l) => {
  let ret = [];

  for (let i = 0; i < l.length; i++) {
    let c = {
      id: l[i].codigo,
      nome: l[i].codigo + " - " + l[i].titulo,
      titulo: l[i].titulo,
      status: l[i].status,
      descricao: l[i].descricao,
      tp: ternaryOp(l[i].tipoProc, ""),
      pt: ternaryOp(l[i].procTrans, ""),
      na: mapJoin(l[i].notasAp, "nota"),
      exemploNa: mapJoin(l[i].exemplosNotasAp, "exemplo"),
      ne: mapJoin(l[i].notasEx, "nota"),
      ti: mapJoin(l[i].termosInd, "termo"),
      pca: ternaryOp(l[i].pca.valores, ""),
      fc_pca: ternaryOp(l[i].pca.formaContagem, ""),
      sfc_pca: ternaryOp(l[i].pca.subFormaContagem, ""),
      crit_pca: ternaryMap(l[i].pca.justificacao, "tipoId"),
      df: ternaryOp(l[i].df.valor, ""),
      crit_df: ternaryMap(l[i].df.justificacao, "tipoId"),
      donos: ternaryMap(l[i].donos, "idDono"),
      participantes: ternaryMap(l[i].participantes, "idParticipante"),
      tipo_participacao: ternaryMap(l[i].participantes, "participLabel"),
    };

    if (l[i].filhos) {
      c.filhos = exports.filterPesquisaInfo(l[i].filhos);
    }

    ret.push(c);
  }

  return ret;
};

//função auxiliar de filterProcs, obtém o status de uma classe, dado o seu id e a arvore de classes
function searchClasse(proc, classes) {
  var status = null;

  if (classes[0] && classes[0].filhos) {
    var aux = proc.substr(1).split(".");
    var codigos = [aux[0]];

    for (var w = 1; w < aux.length; w++)
      codigos.push(codigos[w - 1] + "." + aux[w]);

    var classe;
    for (var j = 0; j < codigos.length; j++) {
      classe = null;

      for (var i = 0; i < classes.length && classe == null; i++)
        if (classes[i].codigo == codigos[j]) classe = classes[i];

      if (classe) classes = classe.filhos;
    }

    if (classe) status = classe.status;
  } else {
    for (var i = 0; i < classes.length && status == null; i++)
      if ("c" + classes[i].codigo == proc) status = classes[i].status;
  }

  return status;
}

//função auxiliar de filterJusts, remove os processos da lista processos que não estão ativos
function filterProcs(processos, classesI) {
  var procs = [];

  for (var i = 0; i < processos.length; i++) {
    var status = searchClasse(processos[i].procId, classesI);

    if (status == "A") procs.push(JSON.parse(JSON.stringify(processos[i])));
  }

  return procs;
}

//função auxiliar de filterStatus, remove os processos das justificações que não estão ativos
function filterJusts(justificacao, classesI) {
  var justs = [];

  for (var j = 0; j < justificacao.length; j++) {
    var just = JSON.parse(JSON.stringify(justificacao[j]));
    just.processos = filterProcs(justificacao[j].processos, classesI);
    justs.push(just);
  }

  return justs;
}

//Devolve apenas as classes Ativas
exports.filterStatus = (classes, classesI) => {
  var ret = [];

  for (var i = 0; i < classes.length; i++) {
    if (classes[i].status == "A") {
      var classe = JSON.parse(JSON.stringify(classes[i]));

      if (classes[i].filhos)
        classe.filhos = exports.filterStatus(classes[i].filhos, classesI);

      if (classes[i].processosRelacionados)
        classe.processosRelacionados = exports.filterStatus(
          classes[i].processosRelacionados,
          classesI
        );

      if (classes[i].pca && classes[i].pca.justificacao)
        classe.pca.justificacao = filterJusts(
          classes[i].pca.justificacao,
          classesI
        );

      if (classes[i].df && classes[i].df.justificacao)
        classe.df.justificacao = filterJusts(
          classes[i].df.justificacao,
          classesI
        );

      ret.push(classe);
    }
  }

  return ret;
};

//remove o campo status
exports.removeStatus = (l) => {
  for (let i = 0; i < l.length; i++) {
    delete l[i].status;

    if (l[i].filhos) {
      exports.removeStatus(l[i].filhos);
    }
  }
};

async function loadClasses() {
  try {
    let classes = await Classes.listar(null);
    levelClasses[0] = JSON.parse(JSON.stringify(classes));
    // Carregamento da informação das classes de nível 1
    for (var i = 0; i < classes.length; i++) {
      classes[i].drop = false;
      let cid = classes[i].id.split("#")[1];
      let desc = await Classes.descendencia(cid);
      levelClasses[1] = levelClasses[1].concat(
        JSON.parse(JSON.stringify(desc))
      );

      let na = await Classes.notasAp(cid);
      notasAplicacao = notasAplicacao.concat({
        classe: cid,
        notas: JSON.parse(JSON.stringify(na.map((n) => n.nota))),
      });
      let ex = await Classes.exemplosNotasAp(cid);
      exemplosNotasAplicacao = exemplosNotasAplicacao.concat({
        classe: cid,
        exemplos: JSON.parse(JSON.stringify(ex.map((e) => e.exemplo))),
      });

      // Carregamento da informação das classes de nível 2
      for (var j = 0; j < desc.length; j++) {
        let cid2 = desc[j].id.split("#")[1];
        desc[j].drop = false;
        let desc2 = await Classes.descendencia(cid2);
        levelClasses[2] = levelClasses[2].concat(
          JSON.parse(JSON.stringify(desc2))
        );

        let na = await Classes.notasAp(cid2);
        notasAplicacao = notasAplicacao.concat({
          classe: cid2,
          notas: JSON.parse(JSON.stringify(na.map((n) => n.nota))),
        });
        let ex = await Classes.exemplosNotasAp(cid2);
        exemplosNotasAplicacao = exemplosNotasAplicacao.concat({
          classe: cid2,
          exemplos: JSON.parse(JSON.stringify(ex.map((e) => e.exemplo))),
        });

        // Carregamento da informação das classes de nível 3
        for (var k = 0; k < desc2.length; k++) {
          desc2[k].drop = false;
          let cid3 = desc2[k].id.split("#")[1];
          if (cid3.includes("_")) continue;
          let desc3 = await Classes.descendencia(cid3);
          levelClasses[3] = levelClasses[3].concat(
            JSON.parse(JSON.stringify(desc3))
          );
          let na = await Classes.notasAp(cid3);
          notasAplicacao = notasAplicacao.concat({
            classe: cid3,
            notas: JSON.parse(JSON.stringify(na.map((n) => n.nota))),
          });
          let ex = await Classes.exemplosNotasAp(cid3);
          exemplosNotasAplicacao = exemplosNotasAplicacao.concat({
            classe: cid3,
            exemplos: JSON.parse(JSON.stringify(ex.map((e) => e.exemplo))),
          });
          let ti3 = await Classes.ti(cid3);
          termosInd = termosInd.concat({
            classe: cid3,
            termos: JSON.parse(JSON.stringify(ti3.map((t) => t.termo))),
          });

          // Carregamento dos TI das classes de nível 4
          for (var l = 0; l < desc3.length; l++) {
            let cid4 = desc3[l].id.split("#")[1];
            let ti4 = await Classes.ti(cid4);
            termosInd = termosInd.concat({
              classe: cid4,
              termos: JSON.parse(JSON.stringify(ti4.map((t) => t.termo))),
            });
          }

          desc2[k].filhos = desc3;
        }
        desc[j].filhos = desc2;
      }
      classes[i].filhos = desc;
    }
    return classes;
  } catch (err) {
    throw err;
  }
}

async function getAllClassesInfo(list) {
  var ret = [];

  for (var i = 0; i < list.length; i++) {
    var classe = await Classes.retrieve("c" + list[i].codigo);
    classe.filhos = await getAllClassesInfo(classe.filhos);
    ret.push(classe);
  }

  return ret;
}

async function loadClassesInfo() {
  try {
    return await getAllClassesInfo(classTree);
  } catch (err) {
    throw err;
  }
}

//indice de pesquisa

exports.getIndicePesquisa = async () => {
  return indicePesquisa;
};

async function criaIndicePesquisa() {
  let notas = await NotasAp.todasNotasAp();
  let exemplos = await ExemplosNotasAp.todosExemplosNotasAp();
  let tis = await TermosIndice.listar();
  let indice = [];

  //  [ {codigo:"cxxx", titulo:"...", notas: [], exemplos:[], tis:[]}, ...]
  indice = indice.concat(
    classList.map((c) => ({
      codigo: c.codigo,
      titulo: c.titulo,
      notas: [],
      exemplos: [],
      tis: [],
    }))
  );
  // Vamos colocar as notas no processo certo
  notas.forEach((n) => {
    var index = indice.findIndex((c) => {
      return "c" + c.codigo == n.cProc;
    });
    if (index != -1) {
      indice[index].notas.push(n.nota);
    } else {
      console.log(
        "Cálculo do índice::Notas:: não encontrei a classe com código: " +
          n.cProc
      );
    }
  });

  // Vamos fazer o mesmo para os exemplos
  exemplos.forEach((e) => {
    var index = indice.findIndex((c) => {
      return "c" + c.codigo == e.cProc;
    });
    if (index != -1) {
      indice[index].exemplos.push(e.exemplo);
    } else {
      console.log(
        "Cálculo do índice::Exemplos:: não encontrei a classe com código: " +
          e.cProc
      );
    }
  });
  // Vamos fazer o mesmo para os tis
  tis.forEach((t) => {
    var index = indice.findIndex((c) => {
      return "c" + c.codigo == t.codigoClasse;
    });
    if (index != -1) {
      indice[index].tis.push(t.termo);
    } else {
      console.log(
        "Cálculo do índice::Termos:: não encontrei a classe com código: " +
          t.codigoClasse
      );
    }
  });

  return indice;
}

//legislacao

exports.getLegislacoes = () => {
  return JSON.parse(JSON.stringify(legislacao));
};

exports.getLegislacao = (id) => {
  let res = legislacao.filter((l) => l.id == id);
  if (res.length > 0) {
    return JSON.parse(JSON.stringify(res[0]));
  } else return null;
};

// Devolve o uma legislação a partir do seu tipo e número
exports.getLegislacaoByTipoNumero = (t, n) => {
  let res = legislacao.filter((l) => l.tipo == t && l.numero == n);
  if (res.length > 0) {
    return JSON.parse(JSON.stringify(res[0]));
  } else return null;
};

//Atualiza uma legislação no catálogo
exports.loadLegislacao = async (id) => {
  try {
    let leg = await Legs.consultar(id);
    legislacao.splice(
      legislacao.findIndex((l) => l.id == id),
      1
    );
    leg.id = id;
    legislacao.push(leg);
  } catch (err) {
    throw err;
  }
};

// Carrega o catálogo legislativo na cache
async function loadLegs() {
  try {
    let legs = await Legs.listar();
    return legs;
  } catch (err) {
    throw err;
  }
}

//entidades

exports.getEntidades = () => {
  return JSON.parse(JSON.stringify(entidades));
};

exports.getEntidade = (id) => {
  let res = entidades.filter((e) => e.id == id);
  if (res.length > 0) {
    return JSON.parse(JSON.stringify(res[0]));
  } else return null;
};

// Carrega as entidades para cache
async function loadEntidades() {
  try {
    let ents = await Entidades.listar("True");
    return ents;
  } catch (err) {
    throw err;
  }
}

exports.updateClasseTreeInfo = (classe) => {
  classe.status = "A";
  classe.filhos = [];
  classe.tipoProc = "";
  classe.procTrans = "";
  classe.id = `http://jcr.di.uminho.pt/m51-clav#c${classe.codigo}`;

  let pai, i;
  if (classe.pai.codigo) {
    let classLvl = classe.pai.codigo.split(".");
    if (classLvl.length === 1) {
      pai = classTreeInfo.findIndex((c) => classe.pai.codigo === c.codigo);
      i = classTreeInfo[pai].filhos.findIndex((c) => classe.codigo < c.codigo);
      if (i !== -1) {
        classTreeInfo[pai].filhos.splice(i, 0, classe);
      } else {
        classTreeInfo[pai].filhos.push(classe);
      }
    } else {
      avo = classTreeInfo.findIndex((c) => classLvl[0] === c.codigo);
      pai = classTreeInfo[avo].filhos.findIndex(
        (c) => classe.pai.codigo === c.codigo
      );
      i = classTreeInfo[avo].filhos[pai].filhos.findIndex(
        (c) => classe.codigo < c.codigo
      );
      if (i !== -1) {
        classTreeInfo[avo].filhos[pai].filhos.splice(i, 0, classe);
      } else {
        classTreeInfo[avo].filhos[pai].filhos.push(classe);
      }
    }
  } else {
    i = classTreeInfo.findIndex((c) => classe.codigo < c.codigo);
    if (i !== -1) {
      classe.pai = {};
      classTreeInfo.splice(i, 0, classe);
    } else {
      classTreeInfo.push(classe);
    }
  }
  fs.writeFileSync(
    "./public/classes/classesInfo.json",
    JSON.stringify(classTreeInfo, null, 4)
  );
};
