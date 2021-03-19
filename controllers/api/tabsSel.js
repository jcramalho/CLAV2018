const nanoid = require("nanoid");
const { execQuery } = require("./utils");
const { normalize } = require("./utils");
const { projection } = require("./utils");
const Pedidos = require("./pedidos");
const { pca } = require("./classes");
const Classe = require("./classes");
const Tipologias = require("./tipologias");
const State = require("../state");

const SelTabs = module.exports;

SelTabs.list = async function () {
  const query = `
    SELECT * WHERE { 
        ?id rdf:type clav:TabelaSelecao ;
            clav:designacao ?designacao ;
            clav:dataAprovacao ?data ;
            clav:eRepresentacaoDe ?leg;
            clav:temEntidade ?entidades .
        ?leg clav:diplomaTipo ?tipoLeg ;
        	   clav:diplomaNumero ?numLeg .
    }
    `;
  const campos = ["id", "designacao", "data", "tipoLeg", "numLeg"];
  const agrupar = ["entidades"];

  try {
    const result = await execQuery("query", query);
    return projection(normalize(result), campos, agrupar);
  } catch (erro) {
    throw erro;
  }
};

SelTabs.consultar = async function (id) {
  let query = `
        select * where {
            clav:${id} a clav:TabelaSelecao ;
                    clav:designacao ?designacao ;
                    clav:dataAprovacao ?data ;
                    clav:temEntidade ?entidades ;
                    clav:tsResponsavel ?responsavel ;
                    clav:temEntidadeResponsavel ?entidade .
        }
    `;
  try {
    let response = await execQuery("query", query);
    response = normalize(response);

    const res = {
      designacao: response[0].designacao,
      data: response[0].data,
      entidades: response.map((r) => r.entidades.split("#ent_")[1]),
      responsavel: response[0].responsavel,
      entidade: response[0].entidade.split("#ent_")[1],
      classes: [],
    };

    query = `
            select * where {
                ?classe clav:pertenceTS clav:${id} ;
                        clav:codigo ?codigo .
            } order by ?codigo
        `;

    let listClasses = await execQuery("query", query);
    listClasses = normalize(listClasses);

    for (const classe of listClasses) {
      const c = await Classe.retrieve(classe.classe.split("clav#")[1]);
      res.classes.push(c);
    }

    return res;
  } catch (err) {
    throw err;
  }
};

SelTabs.listClasses = function (table) {
  const listQuery = `
        SELECT DISTINCT
            ?Avo ?AvoCodigo ?AvoTitulo 
            ?Pai ?PaiCodigo ?PaiTitulo 
            ?PN ?PNCodigo ?PNTitulo   
            (GROUP_CONCAT(CONCAT(STR(?Filho),":::",?FilhoCodigo, ":::",?FilhoTitulo); SEPARATOR="###") AS ?Filhos)
        WHERE {  
            
            ?PN rdf:type clav:Classe_N3.
            ?PN clav:pertenceLC clav:${table}.
            
            ?PN clav:temPai ?Pai.
            ?Pai clav:temPai ?Avo.
            
            ?PN clav:codigo ?PNCodigo;
                clav:titulo ?PNTitulo.
            
            ?Pai clav:codigo ?PaiCodigo;
                clav:titulo ?PaiTitulo.
            
            ?Avo clav:codigo ?AvoCodigo;
                clav:titulo ?AvoTitulo.
            
            OPTIONAL {
                ?Filho clav:temPai ?PN;
                clav:codigo ?FilhoCodigo;
                clav:titulo ?FilhoTitulo
            }
        }
        Group By ?PN ?PNCodigo ?PNTitulo ?Pai ?PaiCodigo ?PaiTitulo ?Avo ?AvoCodigo ?AvoTitulo 
        Order By ?PN
        `;

  return execQuery("query", listQuery)
    .then((response) => Promise.resolve(response.results.bindings))
    .catch((error) => {
      console.error(error);
    });
};

SelTabs.classChildren = function (parent, table) {
  const fetchQuery = `
        SELECT ?Child ?Code ?Title (count(?sub) as ?NChilds)
        WHERE {
            ?Child clav:temPai clav:${parent} ;
                    clav:codigo ?Code ;
                    clav:titulo ?Title
            optional {
                ?sub clav:temPai ?Child ;
            }
        }Group by ?Child ?Code ?Title
        `;

  return (
    execQuery("query", fetchQuery)
      // getting the content we want
      .then((response) => Promise.resolve(response.results.bindings))
      .catch((error) => {
        console.error(error);
      })
  );
};

SelTabs.stats = function (id) {
  return (
    execQuery(
      "query",
      `SELECT * WHERE { 
                clav:${id} rdf:type clav:TabelaSelecao ;
                    clav:designacao ?Name .
            }`
    )
      // getting the content we want
      .then((response) => Promise.resolve(response.results.bindings))
      .catch((error) => {
        console.error(error);
      })
  );
};

SelTabs.createTab = function (id, name, classes, criteriaData) {
  let createQuery = `
            INSERT DATA {
                clav:${id} rdf:type owl:NamedIndividual ,
                        clav:TabelaSelecao ;
                    clav:referencialClassificativoStatus 'H';
                    clav:designacao '${name} ${
    name == "Teste" ? id.replace("ts_", "") : ""
  }' .
        `;

  for (const clas of classes) {
    const clasID = `${id}_${clas.id.value.replace(/[^#]+#(.*)/, "$1")}`;

    const level = clas.Codigo.value.split(".").length;

    createQuery += `
            clav:${clasID} rdf:type owl:NamedIndividual ,
                    clav:Classe_N${level} ;
                clav:status "H" ;
                clav:codigo "${clas.Codigo.value}" ;
                clav:pertenceLC clav:${id} ;
                clav:classeStatus "${clas.Status.value}" .
        `;

    if (clas.Pai) {
      createQuery += `
                clav:${clasID} clav:temPai clav:${`${id}_${clas.Pai.value.replace(
        /[^#]+#(.*)/,
        "$1"
      )}`} .
            `;
    }

    const keyVal = {
      ProcTrans: "processoTransversal",
      Descricao: "descricao",
      Titulo: "titulo",
    };

    for (const key in keyVal) {
      if (clas[key]) {
        createQuery += `
                    clav:${clasID} clav:${keyVal[key]} "${clas[key].value
          .replace(/\n|\r/g, "\\n")
          .replace(/\"/g, '\\"')}" .
                `;
      }
    }

    if (clas.Exemplos.value) {
      for (const val of clas.Exemplos.value.split("%%")) {
        createQuery += `
                    clav:${clasID} clav:exemploNA "${val
          .replace(/\n|\r/g, "\\n")
          .replace(/\"/g, '\\"')}" .
                `;
      }
    }

    const keyMultVal = {
      ProcTipo: "processoTipoVC",
      Donos: "temDono",
      Parts1: "temParticipanteApreciador",
      Parts2: "temParticipanteAssessor",
      Parts3: "temParticipanteComunicador",
      Parts4: "temParticipanteDecisor",
      Parts5: "temParticipanteExecutor",
      Parts6: "temParticipanteIniciador",
      Diplomas: "temLegislacao",
    };

    for (const key in keyMultVal) {
      if (clas[key] && clas[key].value) {
        for (const val of clas[key].value.split("%%")) {
          createQuery += `
                        clav:${clasID} clav:${
            keyMultVal[key]
          } clav:${val.replace(/[^#]+#(.*)/, "$1")} .
                    `;
        }
      }
    }

    const keyNotes = {
      NotasA: "temNotaAplicacao",
      NotasE: "temNotaExclusao",
    };

    let noteID;
    for (const key in keyNotes) {
      if (clas[key] && clas[key].value) {
        for (let val of clas[key].value.split("%%")) {
          val = val.split("::");
          noteID = val[0].replace(/[^#]+#(n[ae]_)(.*)/, `$1${id}_$2`);

          createQuery += `
                        clav:${noteID} rdf:type owl:NamedIndividual,
                                clav:clav:${keyNotes[key].slice(3)};
                            clav:conteudo "${val[1]
                              .replace(/\n|\r/g, "\\n")
                              .replace(/\"/g, '\\"')}".
                        clav:${clasID} clav:${keyNotes[key]} clav:${noteID} .
                    `;
        }
      }
    }

    const keyRels = {
      Rels1: "eSintetizadoPor",
      Rels2: "eSinteseDe",
      Rels3: "eComplementarDe",
      Rels4: "eCruzadoCom",
      Rels5: "eSuplementoPara",
      Rels6: "eSucessorDe",
      Rels7: "eAntecessorDe",
    };

    for (const key in keyRels) {
      if (clas[key] && clas[key].value) {
        for (const val of clas[key].value.split("%%")) {
          createQuery += `
                        clav:${clasID} clav:${
            keyRels[key]
          } clav:${`${id}_${val.replace(/[^#]+#(.*)/, "$1")}`} .
                    `;
        }
      }
    }

    if (level >= 3 && clas.DFvalor) {
      createQuery += `
                clav:pca_${clasID} rdf:type clav:PCA,
                        owl:NamedIndividual .

                clav:df_${clasID} rdf:type clav:DestinoFinal,
                        owl:NamedIndividual .

                clav:${clasID} clav:temPCA  clav:pca_${clasID} ;
                    clav:temDF clav:df_${clasID} .


                clav:just_pca_${clasID} rdf:type clav:JustificacaoPCA,
                        owl:NamedIndividual .

                clav:just_df_${clasID} rdf:type clav:JustificacaoDF,
                        owl:NamedIndividual .

                clav:pca_${clasID} clav:temJustificacao clav:just_pca_${clasID} .
                clav:df_${clasID} clav:temJustificacao clav:just_df_${clasID} .
            `;

      if (clas.PCAcontagem && clas.PCAcontagem.value) {
        createQuery += `
                    clav:pca_${clasID} clav:pcaFormaContagemNormalizada clav:${clas.PCAcontagem.value.replace(
          /[^#]+#(.*)/,
          "$1"
        )} .
                `;
      }
      if (clas.PCAsubcontagem && clas.PCAsubcontagem.value) {
        createQuery += `
                    clav:pca_${clasID} clav:pcaSubformaContagem clav:${clas.PCAsubcontagem.value.replace(
          /[^#]+#(.*)/,
          "$1"
        )} .
                `;
      }
      if (clas.PCAvalor && clas.PCAvalor.value) {
        createQuery += `
                    clav:pca_${clasID} clav:pcaValor '${clas.PCAvalor.value}' .
                `;
      }
      if (clas.DFvalor && clas.DFvalor.value) {
        createQuery += `
                    clav:df_${clasID} clav:dfValor '${clas.DFvalor.value}' .
                `;
      }
    }
    const critCount = {
      pca: 0,
      df: 0,
    };
    const critsToRemove = [];
    for (const [critIndex, crit] of criteriaData.entries()) {
      const critID = crit.id.value.replace(/[^#]+#(.*)/, "$1");
      const pID = critID.replace(/.*(c[0-9]{3}\.[0-9]{2}.[0-9]{3}).*/, "$1");
      const critCat = critID.replace(/crit_just_([^_]*)_.*/, "$1");

      if (pID == clas.id.value.replace(/[^#]+#(.*)/, "$1")) {
        const n = critCount[critCat];
        critCount[critCat]++;

        createQuery += `
                    clav:crit_just_${critCat}_${clasID}_${n} rdf:type clav:${crit.Tipo.value.replace(
          /[^#]+#(.*)/,
          "$1"
        )} ,
                            owl:NamedIndividual .

                    clav:just_${critCat}_${clasID} clav:temCriterio clav:crit_just_${critCat}_${clasID}_${n} .
                `;

        if (crit.Conteudo.value) {
          createQuery += `
                        clav:crit_just_${critCat}_${clasID}_${n} clav:conteudo "${crit.Conteudo.value
            .replace(/\n|\r/g, "\\n")
            .replace(/\"/g, '\\"')}" .
                    `;
        }
        if (crit.Legislacao.value) {
          for (const dip of crit.Legislacao.value.split("###")) {
            createQuery += `
                            clav:crit_just_${critCat}_${clasID}_${n} clav:temLegislacao clav:${dip.replace(
              /[^#]+#(.*)/,
              "$1"
            )} .
                        `;
          }
        }
        if (crit.Processos.value) {
          for (const proc of crit.Processos.value.split("###")) {
            createQuery += `
                            clav:crit_just_${critCat}_${clasID}_${n} clav:temProcessoRelacionado clav:${proc.replace(
              /[^#]+#(.*)/,
              "$1"
            )} .
                        `;
          }
        }
        critsToRemove.push(critIndex);
      }
    }
  }

  createQuery += "}";

  return execQuery("update", createQuery)
    .then((response) => Promise.resolve(response))
    .catch((error) => console.error(`Error in create:\n${error}`));
};

SelTabs.deleteTab = function (id) {
  const delQuery = `
        DELETE {
            clav:${id} clav:status ?status .
        }
        INSERT {
            clav:${id} clav:status 'I' .
        }
        WHERE {
            clav:${id} clav:status ?status .
        }
    `;

  return (
    execQuery("update", delQuery)
      // getting the content we want
      .then((response) => Promise.resolve(response))
      .catch((error) => {
        console.error(error);
      })
  );
};

SelTabs.trueDelete = function (id) {
  const delQuery = `
        DELETE {
            clav:${id} ?s1 ?p1 .
            ?classe ?s2 ?p2 .
            ?s3 ?p3 ?classe .
            ?s4 ?p4 clav:${id} .
        }
        WHERE {
            clav:${id} ?s1 ?p1 .
            ?classe clav:pertenceLC clav:${id};
                ?s2 ?p2 .
            ?s3 ?p3 ?classe .
            ?s4 ?p4 clav:${id} .
        }
    `;

  return (
    execQuery("update", delQuery)
      // getting the content we want
      .then((response) => Promise.resolve(response))
      .catch((error) => {
        console.error(error);
      })
  );
};

function parseCell(cell) {
  if (cell != null) {
    const type = typeof cell;

    if (type != "string") {
      if (type == "object" && cell.richText) {
        cell = cell.richText.map((e) => e.text).join("");
      } else {
        cell = JSON.stringify(cell);
      }
    }
  }

  return cell;
}

async function validateColumnsValues(
  worksheet,
  start,
  headers,
  typeOrg,
  fonteL,
  entidades_ts
) {
  let cods = [];
  let refs = [];
  let nivel = [];
  const ret = [];
  let c;

  if (fonteL == "PGD/LC" || fonteL == "PGD" || fonteL == "RADA") {
    // nivel
    nivel = worksheet.getColumn(headers.nivel).values;
    nivel = nivel.map((e) => parseCell(e));
  }

  for (let i = start; i < nivel.length; i++) {
    if (!/^\s*[1-4]\s*$/g.test(nivel[i])) {
      throw `Nível inválido na linha ${i} da tabela!\n O nível da classe está compreendido entre 1 e 4`;
    }
  }

  // codigos
  if (fonteL == "TS/LC" || fonteL == "PGD/LC") {
    worksheet
      .getColumn(headers.codigos)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber >= start)
          cods.push(parseCell(cell.value).replace(/\s*/g, ""));
      });

    for (let i = 0; i < cods.length; i++) {
      if (!/^\s*\d{3}(\.\d{2}(\.\d{3}(\.\d{2})?)?)?\s*$/g.test(cods[i])) {
        throw `Código inválido na linha ${
          i + start
        } da tabela!\nO código para ser válido deve ser, por exemplo, no seguinte formato: 100 ou 150.01 ou 200.20.002 ou 400.20.100.01`;
      }
      if (
        fonteL == "PGD/LC" &&
        cods[i] &&
        !cods[i].split(".").length == nivel[i + start]
      ) {
        throw `Nível inválido na linha ${
          i + start
        } da tabela!\nO nível não corresponde com o código do processo`;
      }
    }
  } else {
    if (headers.codigos != -1 && headers.nRef != -1) {
      worksheet
        .getColumn(headers.codigos)
        .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= start) cods.push(parseCell(cell.value));
        });

      worksheet
        .getColumn(headers.nRef)
        .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= start) refs.push(parseCell(cell.value));
        });

      for (let i = 0; i < cods.length; i++) {
        if (
          nivel[i + start] >= 3 &&
          !/^\s*[\d\w\.\:\-]+\s*$/g.test(cods[i]) &&
          !/^\s*[\d\w\.\:\-]+\s*$/g.test(refs[i])
        ) {
          throw `Código e Nº. Referência não encontrados na linha ${
            i + start
          } da tabela!\nTem de ter pelo menos 1 preenchido`;
        }
      }
    }
  }

  // titulos
  c = worksheet.getColumn(headers.titulos).values;
  c = c.map((e) => parseCell(e));

  for (let i = start; i < c.length; i++) {
    if (c[i] == null) {
      throw `Título inválido na linha ${i} da tabela!`;
    }
  }

  if (typeOrg == "TS Organizacional") {
    if (fonteL == "TS/LC" || fonteL == "PGD/LC") {
      // donos
      c = worksheet.getColumn(headers.donos).values;
      c = c.map((e) => parseCell(e));

      for (let i = start; i < c.length; i++) {
        if (c[i] != null && !/^\s*[xX]\s*$|\r?\n|\r|\s*/g.test(c[i])) {
          throw `Célula inválida na linha ${i} e coluna ${headers.donos} da tabela!\nApenas deve conter x ou X (processo selecionado) ou nada (processo não selecionado).`;
        }
      }

      // participantes
      c = worksheet.getColumn(headers.participantes).values;
      c = c.map((e) => parseCell(e));

      for (let i = start; i < c.length; i++) {
        if (
          c[i] != null &&
          !/^\s*(Apreciador|Assessor|Comunicador|Decisor|Executor|Iniciador|[xX])\s*$/g.test(
            c[i]
          )
        ) {
          throw `Célula inválida na linha ${i} e coluna ${headers.participantes} da tabela!\nApenas deve conter o tipo de participação (Apreciador, Assessor, Comunicador, Decisor, Executor ou Iniciador) ou nada (processo não selecionado).`;
        }
      }
    }
  } else if (typeOrg == "TS Pluriorganizacional") {
    let ents_tips = State.getEntidades().map((e) => ({
      sigla: e.sigla,
      designacao: e.designacao,
    }));
    let tips = await Tipologias.listar('?estado="Ativa"');
    ents_tips = ents_tips.concat(
      tips.map((t) => ({ sigla: t.sigla, designacao: t.designacao }))
    );

    if (fonteL == "PGD/LC") {
      // donos
      c = worksheet.getColumn(headers.donos).values;
      c = c.map((e) => parseCell(e));

      for (let i = start; i < c.length; i++) {
        if (c[i] != null) {
          if (!/^\s*\w+\s*(#\s*\w+\s*)*#*$/g.test(c[i])) {
            throw `Célula inválida na linha ${i} e coluna ${headers.donos} da tabela!\nApenas deve conter siglas de entidades/tipologias separadas por '#' ou nada (processo não selecionado).`;
          } else {
            const siglas = c[i].split("#");
            siglas[siglas.length - 1] == "" ? siglas.pop() : "";
            for (let sigla of siglas) {
              sigla = sigla.replace(/\r?\n|\r|\s*/g, "");
              const aux = ents_tips.filter((e) => e.sigla == sigla);

              if (!aux.length > 0) {
                throw `Célula inválida na linha ${i} e coluna ${headers.donos} da tabela!\nA entidade/tipologia ${sigla} não existe.`;
              } else if (!ret.filter((e) => e.sigla == sigla).length > 0) {
                ret.push(aux[0]);
              }
            }
          }
        }
      }

      // participantes
      let p = worksheet.getColumn(headers.participantes).values;
      p = p.map((e) => parseCell(e));

      for (let i = start; i < p.length; i++) {
        if (p[i] != null) {
          if (!/^\s*\w+\s*(#\s*\w+\s*)*#*$/g.test(p[i])) {
            throw `Célula inválida na linha ${i} e coluna ${headers.participantes} da tabela!\nApenas deve conter siglas de entidades/tipologias separadas por '#' ou nada (processo não selecionado).`;
          } else {
            const siglas = p[i].split("#");
            siglas[siglas.length - 1] == "" ? siglas.pop() : "";
            for (let sigla of siglas) {
              sigla = sigla.replace(/\r?\n|\r|\s*/g, "");
              const aux = ents_tips.filter((e) => e.sigla == sigla);
              if (!aux.length > 0) {
                throw `Célula inválida na linha ${i} e coluna ${headers.participantes} da tabela!\nA entidade/tipologia ${sigla} não existe.`;
              } else if (!ret.filter((e) => e.sigla == sigla).length > 0) {
                ret.push(aux[0]);
              }
            }
          }
        }
      }
      let erro = [];

      ret.map((e) => (!entidades_ts.includes(e.sigla) ? erro.push(e) : ""));
      if (erro.length > 0) {
        throw new EntidadesException(
          "Erro ao inserir a Tabela de Seleção: As seguintes entidades estão presentes no ficheiro mas não foram selecionadas.\n",
          erro,
          true
        );
      }

      entidades_ts.map((e) => {
        !ret.some(function (ent) {
          return ent.sigla == e;
        })
          ? erro.push(ents_tips.find((ent) => ent.sigla == e))
          : "";
      });
      if (erro.length > 0) {
        throw new EntidadesException(
          "Erro ao inserir a Tabela de Seleção: As seguintes entidades foram selecionadas mas não se encontram presentes no ficheiro.\n",
          erro,
          false
        );
      }
    }
    if (fonteL == "TS/LC") {
      // tipo participação
      let tp = worksheet.getColumn(headers.tipo_participacao).values;
      tp = tp.map((e) => parseCell(e));

      for (let i = start; i < tp.length; i++) {
        if (
          tp[i] != null &&
          !/^\s*(Apreciador|Assessor|Comunicador|Decisor|Executor|Iniciador)\s*(#\s*(Apreciador|Assessor|Comunicador|Decisor|Executor|Iniciador)\s*)*$/g.test(
            tp[i]
          )
        ) {
          throw `Célula inválida na linha ${i} e coluna ${headers.tipo_participacao} da tabela!\nApenas deve conter os tipos de participação (Apreciador, Assessor, Comunicador, Decisor, Executor ou Iniciador) separados por '#' ou nada (processo não selecionado).`;
        }
      }

      // match length
      if (tp.length != p.length) {
        throw "Os tamanhos das colunas 'Participante' e 'Tipo de participação' não coincidem.";
      }

      for (let i = start; i < p.length; i++) {
        if (p[i] != null && tp[i] != null) {
          const siglas = p[i].split("#");
          const tps = tp[i].split("#");

          if (siglas.length != tps.length) {
            throw `As células das colunas 'Participante' e 'Tipo de participação' na linha ${i} não tem o mesmo número de elementos.`;
          }
        } else if (p[i] == null && tp[i] != null) {
          throw `As células das colunas 'Participante' e 'Tipo de participação' na linha ${i} não tem o mesmo número de elementos.`;
        } else if (p[i] != null && tp[i] == null) {
          throw `As células das colunas 'Participante' e 'Tipo de participação' na linha ${i} não tem o mesmo número de elementos.`;
        }
      }
    }
  }

  if (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") {
    if (fonteL == "PGD") {
      // pca e nota PCA
      const pcas = [];
      worksheet
        .getColumn(headers.pca)
        .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= start) pcas.push(parseCell(cell.value));
        });

      const notas = [];
      worksheet
        .getColumn(headers.notaPCA)
        .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= start) notas.push(parseCell(cell.value));
        });

      for (let i = 0; i < pcas.length; i++) {
        if (
          (nivel[i + start] == 3 &&
            pcas[i] == null &&
            notas[i] == null &&
            nivel[i + start + 1] != 4 &&
            nivel[i + start + 2] != 4) ||
          (nivel[i + start] == 4 && pcas[i] == null && notas[i] == null)
        ) {
          throw `O campo PCA e a Nota do PCA não estão preenchidos na linha ${
            i + start
          } da Tabela!\n Pelo menos um dos campos tem de estar preenchido`;
        }
        if (
          pcas[i] != null &&
          !/^\s*[0-9]\s*$|^\s*[1-9][0-9]\s*$|^\s*1[0-9][0-9]\s*$|^\s*[0-9]{1,3}[\.\,][0-9]{1,2}\s*$/g.test(
            pcas[i]
          )
        ) {
          throw `O campo PCA é ínválido na linha ${
            i + start
          } da Tabela!\n O campo tem de ser composto por algarismos podendo ter até duas casas decimais (0 a 199).\n`;
        }
      }
    } else {
      // pca, nota PCA e Forma de contagem do PCA
      let lvl4 = [];
      if (fonteL == "PGD/LC") {
        lvl4 = cods.filter((c) => c.split(".").length == 4);
      }
      const pcas = [];
      worksheet
        .getColumn(headers.pca)
        .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= start) pcas.push(parseCell(cell.value));
        });

      const notas = [];
      worksheet
        .getColumn(headers.notaPCA)
        .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= start) notas.push(parseCell(cell.value));
        });

      const formas = [];
      worksheet
        .getColumn(headers.formaContagem)
        .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= start) formas.push(parseCell(cell.value));
        });

      for (let i = 0; i < pcas.length; i++) {
        if (
          (fonteL == "PGD/LC" &&
            cods[i].split(".").length == 3 &&
            !lvl4.some((c) => c.includes(cods[i])) &&
            notas[i] == null &&
            pcas[i] == null) ||
          (fonteL == "PGD/LC" &&
            cods[i].split(".").length == 4 &&
            pcas[i] == null &&
            notas[i] == null)
        ) {
          throw `O campo PCA e a Nota do PCA não estão preenchidos na linha ${
            i + start
          } da Tabela!\n Pelo menos um dos campos tem de estar preenchido`;
        }
        if (
          (fonteL == "RADA" &&
            nivel[i + start] == 3 &&
            pcas[i] == null &&
            notas[i] == null &&
            nivel[i + start + 1] != 4 &&
            nivel[i + start + 2] != 4) ||
          (fonteL == "RADA" &&
            nivel[i + start] == 4 &&
            pcas[i] == null &&
            notas[i] == null)
        ) {
          throw `O campo PCA e a Nota do PCA não estão preenchidos na linha ${
            i + start
          } da Tabela!\n Pelo menos um dos campos tem de estar preenchido`;
        }

        if (
          (fonteL == "PGD/LC" &&
            cods[i].split(".").length == 3 &&
            !lvl4.some((c) => c.includes(cods[i])) &&
            pcas[i] != null &&
            !/^\s*F[0-9]{2}\s*$|^\s*F01\.[0-9]{2}\s*$/g.test(formas[i])) ||
          (fonteL == "PGD/LC" &&
            cods[i].split(".").length == 4 &&
            pcas[i] != null &&
            cods[i] != "400.10.001" &&
            !/^\s*F[0-9]{2}\s*$|^\s*F01\.[0-9]{2}\s*$/g.test(formas[i]))
        ) {
          throw `O campo Forma de contagem é ínválido na linha ${
            i + start
          } da Tabela!\n O campo tem de estar preenchido se o PCA também estiver.\n A Forma de contagem, para ser válida deve ser, por exemplo, no seguinte formato: F01,F02...`;
        }
        if (fonteL == "RADA" && nivel[i + start] < 3 && formas[i] != null) {
          throw `O campo Forma de contagem é ínválido na linha ${
            i + start
          } da Tabela!\n O campo não deve estar preenchido para classes abaixo do 3º nível.\n`;
        }
        if (
          pcas[i] != null &&
          cods[i] != "400.10.001" &&
          !/^\s*[0-9]\s*$|^\s*[1-9][0-9]\s*$|^\s*1[0-9][0-9]\s*$|^\s*[0-9]{1,3}[\.\,][0-9]{1,2}\s*$/g.test(
            pcas[i]
          )
        ) {
          throw `O campo PCA é ínválido na linha ${
            i + start
          } da Tabela!\n O campo tem de ser composto por algarismos podendo ter até duas casas decimais (0 a 199).\n`;
        }
      }
    }

    // df e nota DF

    const dfs = [];
    worksheet
      .getColumn(headers.df)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber >= start) dfs.push(parseCell(cell.value));
      });

    const dfNotas = [];
    worksheet
      .getColumn(headers.notaDF)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber >= start) dfNotas.push(parseCell(cell.value));
      });

    if (fonteL == "PGD/LC") {
      let lvl4 = cods.filter((c) => c.split(".").length == 4);
      for (let i = 0; i < dfs.length; i++) {
        if (
          (cods[i].split(".").length == 3 &&
            !lvl4.some((c) => c.includes(cods[i])) &&
            dfs[i] == null &&
            dfNotas[i] == null) ||
          (cods[i].split(".").length == 4 && dfs[i] == null)
        ) {
          throw `O campo DF e a Nota do DF não estão preenchidos na linha ${
            i + start
          } da Tabela!\n Pelo menos um dos campos tem de estar preenchido`;
        }
        if (dfs[i] != null && !/^\s*(C|CP|E)\s*$/g.test(dfs[i])) {
          throw `O campo DF é inválido na linha ${
            i + start
          }.\nO campo tem de ser: C, CP ou E`;
        }
      }
    } else if (fonteL == "PGD" || fonteL == "RADA") {
      for (let i = 0; i < dfs.length; i++) {
        if (
          (nivel[i + start] == 3 &&
            dfs[i] == null &&
            dfNotas[i] == null &&
            nivel[i + start + 1] != 4 &&
            nivel[i + start + 2] != 4) ||
          (nivel[i + start] == 4 && dfs[i] == null && dfNotas[i] == null)
        ) {
          throw `O campo DF e a Nota do DF não estão preenchidos na linha ${
            i + start
          } da Tabela!\n Pelo menos um dos campos tem de estar preenchido`;
        }
        if (dfs[i] != null && !/^\s*(C|CP|E)\s*$/g.test(dfs[i])) {
          throw `O campo DF é inválido na linha ${
            i + start
          }.\nO campo tem de ser: C, CP ou E`;
        }
      }
    }
  }
  return ret;
}

function HeaderException(message, headersValid) {
  this.message = message;
  this.nHeaders = headersValid;
}

function EntidadesException(message, entidades, acrescenta) {
  this.message = message;
  this.entidades = entidades;
  this.acrescenta = acrescenta;
}

async function validateHeaders(headers, typeOrg, fonteL, entidades_ts, file) {
  let codigos = -1;
  let titulos = -1;
  let donos = -1;
  let parts = -1;
  let tipPart = -1;
  let nRef = -1;
  let nivel = -1;
  let descricao = -1;
  let pca = -1;
  let notaPCA = -1;
  let formaContagem = -1;
  let df = -1;
  let notaDF = -1;
  let nFound = 0;
  let ret = null;

  // typeOrg == "TS Organizacional" ou typeOrg == "TS Pluriorganizacional"
  for (let i = 1; i < headers.length; i++) {
    if (/^\s*Código\s*$/g.test(headers[i])) {
      codigos = i;
    } else if (/^\s*Título\s*$/g.test(headers[i])) {
      titulos = i;
    } else if (/^\s*Dono( PN)?\s*$/g.test(headers[i])) {
      donos = i;
    } else if (/^\s*Participante( PN)?\s*$/g.test(headers[i])) {
      parts = i;
    } else if (/^\s*Tipo de participação\s*$/g.test(headers[i])) {
      tipPart = i;
    } else if (/^\s*N(\.)?º(\sde)?\sRef(erência)?\s*$/g.test(headers[i])) {
      nRef = i;
    } else if (/^\s*Nível\s*$/g.test(headers[i])) {
      nivel = i;
    } else if (/^\s*Descrição\s*$/g.test(headers[i])) {
      descricao = i;
    } else if (/^\s*PCA\s*$/g.test(headers[i])) {
      pca = i;
    } else if (
      /^\s*([Nn][Oo][Tt][Aa](\n|\r|\r\n|\s)?PCA)\s*$/g.test(headers[i])
    ) {
      notaPCA = i;
    } else if (/^\s*DF\s*$/g.test(headers[i])) {
      df = i;
    } else if (/^\s*(Nota (ao )?DF|NOTA (AO )?DF)\s*$/g.test(headers[i])) {
      notaDF = i;
    } else if (
      /^\s*Forma (de )?[cC]ontagem\s+(do )?PCA\s*$/g.test(headers[i])
    ) {
      formaContagem = i;
    }
  }

  if (codigos != -1) nFound++;
  if (titulos != -1) nFound++;
  if ((fonteL == "TS/LC" || fonteL == "PGD/LC") && donos != -1) nFound++;
  if ((fonteL == "TS/LC" || fonteL == "PGD/LC") && parts != -1) nFound++;
  if (fonteL == "TS/LC" && typeOrg == "TS Pluriorganizacional" && tipPart != -1)
    nFound++;
  if ((fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") && nRef != -1)
    nFound++;
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    nivel != -1
  )
    nFound++;
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    descricao != -1
  )
    nFound++;
  if ((fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") && pca != -1)
    nFound++;
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    notaPCA != -1
  )
    nFound++;
  if ((fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") && df != -1)
    nFound++;
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    notaDF != -1
  )
    nFound++;
  if ((fonteL == "PGD/LC" || fonteL == "RADA") && formaContagem != -1) nFound++;

  if (
    (fonteL == "TS/LC" || fonteL == "RADA" || fonteL == "PGD/LC") &&
    codigos == -1
  )
    throw new HeaderException(
      "Não foi possível encontrar a coluna dos códigos.",
      nFound
    );
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    codigos == -1 &&
    nRef == -1
  )
    throw new HeaderException(
      "Não foi possível encontrar as colunas 'Código' e 'N.º Referência' - Necessita de ter pelo menos uma delas.",
      nFound
    );

  if (titulos == -1)
    throw new HeaderException(
      "Não foi possível encontrar a coluna dos títulos.",
      nFound
    );
  if ((fonteL == "TS/LC" || fonteL == "PGD/LC") && donos == -1)
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'Dono'.",
      nFound
    );
  if ((fonteL == "TS/LC" || fonteL == "PGD/LC") && parts == -1)
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'Participante'.",
      nFound
    );
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    nivel == -1
  )
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'Nível'.",
      nFound
    );
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    descricao == -1
  )
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'Descrição'.",
      nFound
    );
  if ((fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") && pca == -1)
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'PCA'.",
      nFound
    );
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    notaPCA == -1
  )
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'Nota PCA'.",
      nFound
    );
  if ((fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") && df == -1)
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'DF'.",
      nFound
    );
  if (
    (fonteL == "PGD" || fonteL == "PGD/LC" || fonteL == "RADA") &&
    notaDF == -1
  )
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'Nota DF'.",
      nFound
    );
  if ((fonteL == "PGD/LC" || fonteL == "RADA") && formaContagem == -1)
    throw new HeaderException(
      "Não foi possível encontrar a coluna 'Forma de contagem PCA'.",
      nFound
    );

  /*Verificação da existência das siglas das entidades no título dos ficheiro
    PGD (Organizacionais/Pluriorganizacionais), PGD/LC (Organizacional), RADA 
  */
  let ents_tips = State.getEntidades().map((e) => ({
    sigla: e.sigla,
    designacao: e.designacao,
  }));
  let tips = await Tipologias.listar('?estado="Ativa"');
  ents_tips = ents_tips.concat(
    tips.map((t) => ({ sigla: t.sigla, designacao: t.designacao }))
  );

  if (typeOrg == "TS Organizacional") {
    if (fonteL == "TS/LC") {
      ret = {
        codigos,
        titulos,
        donos,
        participantes: parts,
      };
    } else if (fonteL == "PGD") {
      let ent = file.split("_")[4].split(".")[0].replace(" ", "_");

      if (
        ents_tips.some((e) => {
          return e.sigla == ent;
        })
      ) {
        if (ent != entidades_ts) {
          throw new EntidadesException(
            `Erro ao inserir a Tabela de Seleção: A sigla da entidade/tipologia que consta no nome do ficheiro (${ent}) não é a mesma da entidade/tipologia selecionada.\n`,
            [ents_tips.find((e) => e.sigla == ent)],
            true
          );
        }
      } else {
        throw new HeaderException(
          `A sigla da entidade/tipologia que consta no nome do ficheiro (${ent}) não existe.\nCertifique-se que a mesma está corretamente escrita e que o ficheiro segue na nomenclatura correta: TS_TipoLegislação ou PGD_NºLegislação_anoLegislação_Entidade`,
          nFound
        );
      }

      ret = {
        codigos,
        nRef,
        nivel,
        titulos,
        descricao,
        pca,
        notaPCA,
        df,
        notaDF,
      };
    } else if (fonteL == "PGD/LC") {
      let ent = file.split("_")[4].split(".")[0].replace(" ", "_");

      if (
        ents_tips.some((e) => {
          return e.sigla == ent;
        })
      ) {
        if (ent != entidades_ts) {
          throw new EntidadesException(
            `Erro ao inserir a Tabela de Seleção: A sigla da entidade/tipologia que consta no nome do ficheiro (${ent}) não é a mesma da entidade/tipologia selecionada.\n`,
            [ents_tips.find((e) => e.sigla == ent)],
            true
          );
        }
      } else {
        throw new HeaderException(
          `A sigla da entidade/tipologia que consta no nome do ficheiro (${ent}) não existe.\nCertifique-se que a mesma está corretamente escrita e que o ficheiro segue na nomenclatura correta: TS_TipoLegislação ou PGD_NºLegislação_anoLegislação_Entidade`,
          nFound
        );
      }

      ret = {
        codigos,
        nRef,
        nivel,
        titulos,
        descricao,
        donos,
        participantes: parts,
        pca,
        notaPCA,
        formaContagem,
        df,
        notaDF,
      };
    } else if (fonteL == "RADA") {
      ent = file.split("_RADA_")[1].split(".")[0].replace(" ", "_");

      if (
        ents_tips.some((e) => {
          return e.sigla == ent;
        })
      ) {
        if (ent != entidades_ts) {
          throw new EntidadesException(
            `Erro ao inserir a Tabela de Seleção: A sigla da entidade/tipologia que consta no nome do ficheiro (${ent}) não é a mesma da entidade/tipologia selecionada.\n`,
            [ents_tips.find((e) => e.sigla == ent)],
            true
          );
        }
      } else {
        throw new HeaderException(
          `A sigla da entidade/tipologia que consta no nome do ficheiro (${ent}) não existe.\nCertifique-se que a mesma está corretamente escrita e que o ficheiro segue na nomenclatura correta: Despacho_NºLegislação_RADA_Entidade`,
          nFound
        );
      }
      ret = {
        codigos,
        nRef,
        nivel,
        titulos,
        descricao,
        pca,
        notaPCA,
        formaContagem,
        df,
        notaDF,
      };
    }
  } else if (typeOrg == "TS Pluriorganizacional") {
    if (fonteL == "TS/LC" && tipPart == -1) {
      throw new HeaderException(
        "Não foi possível encontrar a coluna 'Tipo de participação'.",
        nFound
      );
    } else if (fonteL == "TS/LC") {
      ret = {
        codigos,
        titulos,
        donos,
        participantes: parts,
        tipo_participacao: tipPart,
      };
    } else if (fonteL == "PGD/LC") {
      ret = {
        codigos,
        nRef,
        nivel,
        titulos,
        descricao,
        donos,
        participantes: parts,
        pca,
        notaPCA,
        formaContagem,
        df,
        notaDF,
      };
    } else if (fonteL == "PGD") {
      let aux = file.split("_");
      aux[aux.length - 1] = aux[aux.length - 1].split(".")[0];
      let ents = [];
      for (var i = aux.length - 1; !/^\d+$/.test(aux[i]); i--) {
        ents.push(aux[i].replace(" ", "_"));
      }

      let erro = [];

      ents.map((ent) => {
        if (
          !ents_tips.some((e) => {
            return e.sigla == ent;
          })
        )
          erro.push(ent);
      });
      if (erro.length > 0) {
        throw new HeaderException(
          `As siglas das entidades/tipologias que constam no nome do ficheiro (${erro}) não existem.\nCertifique-se que a mesma está corretamente escrita e que o ficheiro segue na nomenclatura correta: TS_TipoLegislação ou PGD_NºLegislação_anoLegislação_Entidade1_Entidade2_EntidadeN`,
          nFound
        );
      }

      ents.map((e) => {
        !entidades_ts.includes(e)
          ? erro.push(ents_tips.find((ent) => ent.sigla == e))
          : "";
      });
      if (erro.length > 0) {
        throw new EntidadesException(
          "Erro ao inserir a Tabela de Seleção: As seguintes entidades/tipologias estão presentes no nome do ficheiro mas não foram selecionadas.\n",
          erro,
          true
        );
      }

      entidades_ts.map((e) => {
        !ents.includes(e)
          ? erro.push(ents_tips.find((ent) => ent.sigla == e))
          : "";
      });
      if (erro.length > 0) {
        throw new EntidadesException(
          "Erro ao inserir a Tabela de Seleção: As seguintes entidades/tipologias foram selecionadas mas não se encontram presentes no nome do ficheiro.\n",
          erro,
          false
        );
      }
      ret = {
        codigos,
        nRef,
        nivel,
        titulos,
        descricao,
        donos,
        participantes: parts,
        pca,
        notaPCA,
        formaContagem,
        df,
        notaDF,
      };
    }
  }
  return ret;
}

// Descobrir onde está a tabela de onde se obtém os valores
async function findSheet(workbook, typeOrg, fonteL, entidades_ts, file) {
  let sheetN = null;
  let rowHeaderN = null;
  let founded = false;
  let ents_tips = [];
  let headersPos = {};
  let error = "";
  let nSuc = 0;

  for (let i = 0; i < workbook.worksheets.length; i++) {
    const worksheet = workbook.worksheets[i];
    const rC = worksheet.rowCount;

    if (!founded && rC > 0 && worksheet.state == "visible") {
      for (let j = 1; j <= rC && !founded; j++) {
        let row = worksheet.getRow(j).values;
        row = row.map((e) => parseCell(e));
        try {
          headersPos = await validateHeaders(
            row,
            typeOrg,
            fonteL,
            entidades_ts,
            file
          );
          founded = true;
          sheetN = i;
          rowHeaderN = j;
        } catch (e) {
          if (e.entidades) {
            throw e;
          } else if (e.nHeaders > nSuc) {
            error = e.message;
            nSuc = e.nHeaders;
          }
        }
      }
    }
  }
  if (error != "") throw `Não foi encontrada a TS: ${error}`;

  if (founded) {
    try {
      ents_tips = await validateColumnsValues(
        workbook.worksheets[sheetN],
        rowHeaderN + 1,
        headersPos,
        typeOrg,
        fonteL,
        entidades_ts
      );
    } catch (e) {
      if (e.entidades) throw e;
      throw `A TS não se encontra no formato correto: ${e}`;
    }
  }

  return [sheetN, rowHeaderN, headersPos, ents_tips];
}

function constructRADAO(worksheet, file, stats, code, columns, entidades) {
  //Carregar as Legislações
  let leg = State.getLegislacoes();
  //Carregar as Entidades
  let ents = State.getEntidades();

  const regexRADA = RegExp("_RADA_");
  if (!file.startsWith("Despacho") || !regexRADA.test(file)) {
    throw file + " não será processado, o nome não segue a convenção...";
  } else {
    var legId = file.split("Despacho_")[1];
    legId = legId.split("_RADA")[0];

    var legislacao = leg.filter(
      (l) => l.tipo == "Despacho" && l.numero == legId
    )[0];

    var entidade = ents.some((e) => e.sigla == entidades[0])
      ? "ent_" + entidades[0]
      : "tip_" + entidades[0];

    if (legislacao && entidade) {
      code.codigo = "tsRada_" + legislacao.id;
      var rada = [];
      var pais = [];
      var n = 0;

      var currentStatements =
        "\n###  http://jcr.di.uminho.pt/m51-clav#rada_" + legislacao.id + "\n";
      currentStatements +=
        "clav:tsRada_" + legislacao.id + " rdf:type owl:NamedIndividual ,\n";
      currentStatements += "\t\tclav:RADA_Antigo ;\n";
      currentStatements +=
        "\tclav:temEntidadeResponsavel clav:" + entidade + " ;\n";
      currentStatements +=
        "\tclav:eRepresentacaoDe clav:" + legislacao.id + " .\n";
      currentStatements +=
        "clav:" +
        entidade +
        "clav:eResponsavelPor " +
        "clav:tsRada_" +
        legislacao.id +
        " .\n";

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber == 1) return;

        var codigo = row.getCell(columns.codigos).text || "";
        var referencia = row.getCell(columns.nRef).text || "";
        var nivel = row.getCell(columns.nivel).value || "";
        var titulo = row.getCell(columns.titulos).text || "";
        var descricao = row.getCell(columns.descricao).text || "";
        var pca = row.getCell(columns.pca).value || "";
        var notasPCA = row.getCell(columns.notaPCA).text || "";
        var formaContagem = row.getCell(columns.formaContagem).text || "";
        var df = row.getCell(columns.df).text || "";
        var notasDF = row.getCell(columns.notaDF).text || "";

        codigo = codigo.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
        titulo = titulo.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
        descricao = descricao.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
        notasPCA = notasPCA.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
        formaContagem = formaContagem
          .replace(/\r?\n|\r/g, " ")
          .replace(/["]/g, '\\"');
        notasDF = notasDF.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');

        var classeId = "classe_" + nanoid() + "_tsRada_" + legislacao.id;
        currentStatements +=
          "\n###  http://jcr.di.uminho.pt/m51-clav#" + classeId + "\n";
        currentStatements +=
          "clav:" + classeId + " rdf:type owl:NamedIndividual ,\n";
        currentStatements += "\t\tclav:Classe_Antigo_RADA ;\n";
        currentStatements +=
          "\tclav:pertenceAntigoRada clav:tsRada_" + legislacao.id + " ;\n";

        //Quando nivel é 1 necessita reiniciar a identificação de pai
        if (nivel == 1) {
          pais = [];
          pais.push(classeId);
          n = nivel;
        } else if (nivel > n) {
          currentStatements +=
            "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
          pais.push(classeId);
          n = nivel;
        } else if (n == nivel) {
          pais.pop();
          currentStatements +=
            "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
          pais.push(classeId);
          n = nivel;
        } else {
          var nPops = n - nivel + 1;
          for (var i = 0; i < nPops; i++) pais.pop();
          currentStatements +=
            "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
          pais.push(classeId);
          n = nivel;
        }
        if (codigo || referencia) stats.processos++;
        if (codigo) currentStatements += '\tclav:codigo "' + codigo + '" ;\n';
        if (referencia)
          currentStatements +=
            '\tclav:referencia "' + referencia.replace(/\n/, "") + '" ;\n';
        if (titulo) currentStatements += '\tclav:titulo "' + titulo + '" ;\n';
        if (descricao)
          currentStatements += '\tclav:descricao "' + descricao + '" ;\n';
        currentStatements += "\tclav:nivel " + nivel + " .\n";
        currentStatements += `clav:${legislacao.id} clav:temClasse clav:${classeId} .\n`;

        if (pca || notasPCA) {
          currentStatements +=
            "clav:" + classeId + " clav:temPCA clav:pca_" + classeId + " .\n";
          currentStatements +=
            "\n###  http://jcr.di.uminho.pt/m51-clav#pca_" + classeId + "\n";
          currentStatements += "clav:pca_" + classeId + " a clav:PCA .\n";
          if (pca && pca != "Não aplicável")
            currentStatements +=
              "clav:pca_" + classeId + " clav:pcaValor " + pca + " .\n";
          if (notasPCA)
            currentStatements +=
              "clav:pca_" + classeId + ' clav:pcaNota "' + notasPCA + '" .\n';
        }
        if (df || notasDF) {
          currentStatements +=
            "clav:" + classeId + " clav:temDF clav:df_" + classeId + " .\n";
          currentStatements +=
            "\n###  http://jcr.di.uminho.pt/m51-clav#df_" + classeId + "\n";
          currentStatements +=
            "clav:df_" + classeId + " a clav:DestinoFinal .\n";
          if (df)
            currentStatements +=
              "clav:df_" +
              classeId +
              ' clav:dfValor "' +
              df.replace(/\n/, "") +
              '" .\n';
          if (notasDF)
            currentStatements +=
              "clav:df_" + classeId + ' clav:dfNota "' + notasDF + '" .\n';
        }
      });
      return currentStatements;
    } else {
      var error = "RADA: Erro a proccessar " + file;
      if (!legislacao) error += " (Leg inexistente: " + legId + ")";
      if (entidade == "tip_undefined")
        error += " (Entidade ou Tipologia inexistente: " + entidadeId + ")";
      throw error;
    }
  }
}

function constructPGD(worksheet, file, stats, code, columns, entidades) {
  //Carregar as Legislações
  let leg = State.getLegislacoes();
  //Carregar as Entidades
  let ents = State.getEntidades();
  if (file == "lc") return;
  var ano = parseInt(file.split("_")[3]);
  if (ano < 2000) ano -= 1900;
  var legId = file.split("_")[2] + "/" + ano;
  var tipoPGD = file.split("_")[1];

  if (tipoPGD == "PGD")
    var legislacao = leg.filter(
      (l) => l.tipo == "Portaria" && l.numero == legId
    )[0];
  else
    var legislacao = leg.filter(
      (l) => l.tipo == tipoPGD && l.numero == legId
    )[0];

  if (legislacao) {
    var pais = [];
    var n = 0;
    code.codigo = "pgd_" + legislacao.id;
    var currentStatements =
      "\n###  http://jcr.di.uminho.pt/m51-clav#pgd_" + legislacao.id + "\n";
    currentStatements +=
      "clav:pgd_" + legislacao.id + " rdf:type owl:NamedIndividual ,\n";
    currentStatements += "\t\tclav:PGD ;\n";

    entidades = entidades.map((ent) => {
      return ents.some((e) => e.sigla == ent) ? "ent_" + ent : "tip_" + ent;
    });

    currentStatements += entidades
      .map((e) => "\tclav:temEntidade clav:" + e + " ;\n")
      .reduce((prev, ent) => prev + ent);

    currentStatements +=
      "\tclav:eRepresentacaoDe clav:" + legislacao.id + " .\n";

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1) return;
      var codigo = row.getCell(columns.codigos).text || "";
      var referencia = row.getCell(columns.nRef).text || "";
      var nivel = row.getCell(columns.nivel).value || "";
      var titulo = row.getCell(columns.titulos).text || "";
      var descricao = row.getCell(columns.descricao).text || "";
      var pca = row.getCell(columns.pca).value || "";
      var notasPCA = row.getCell(columns.notaPCA).text || "";
      var df = row.getCell(columns.df).text || "";
      var notasDF = row.getCell(columns.notaDF).text || "";

      titulo = titulo.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      descricao = descricao.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      notasPCA = notasPCA.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      notasDF = notasDF.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');

      var classeId = "classe_" + nanoid() + "_pgd_" + legislacao.id;
      currentStatements +=
        "\n###  http://jcr.di.uminho.pt/m51-clav#" + classeId + "\n";
      currentStatements +=
        "clav:" + classeId + " rdf:type owl:NamedIndividual ,\n";
      currentStatements += "\t\tclav:Classe_PGD ;\n";
      currentStatements +=
        "\tclav:pertencePGD clav:pgd_" + legislacao.id + " ;\n";
      //Quando nivel é 1 necessita reiniciar a identificação de pai
      if (nivel == 1) {
        pais = [];
        pais.push(classeId);
        n = nivel;
      } else if (nivel > n) {
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      } else if (n == nivel) {
        pais.pop();
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      } else {
        var nPops = n - nivel + 1;
        for (var i = 0; i < nPops; i++) pais.pop();
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      }
      if (codigo || referencia || titulo) stats.processos++;
      if (codigo) currentStatements += '\tclav:codigo "' + codigo + '" ;\n';
      if (referencia)
        currentStatements +=
          '\tclav:referencia "' + referencia.replace(/\n/, "") + '" ;\n';
      if (titulo) currentStatements += '\tclav:titulo "' + titulo + '" ;\n';
      if (descricao)
        currentStatements += '\tclav:descricao "' + descricao + '" ;\n';

      currentStatements += "\tclav:nivel " + nivel + " .\n";
      currentStatements += `clav:${legislacao.id} clav:temClasse clav:${classeId} .\n`;

      if (pca || notasPCA) {
        currentStatements +=
          "clav:" + classeId + " clav:temPCA clav:pca_" + classeId + " .\n";
        currentStatements +=
          "\n###  http://jcr.di.uminho.pt/m51-clav#pca_" + classeId + "\n";
        currentStatements += "clav:pca_" + classeId + " a clav:PCA .\n";
        if (pca && pca != "Não aplicável")
          currentStatements +=
            "clav:pca_" + classeId + " clav:pcaValor " + pca + " .\n";
        if (notasPCA)
          currentStatements +=
            "clav:pca_" + classeId + ' clav:pcaNota "' + notasPCA + '" .\n';
      }
      if (df || notasDF) {
        currentStatements +=
          "clav:" + classeId + " clav:temDF clav:df_" + classeId + " .\n";
        currentStatements +=
          "\n###  http://jcr.di.uminho.pt/m51-clav#df_" + classeId + "\n";
        currentStatements += "clav:df_" + classeId + " a clav:DestinoFinal .\n";
        if (df)
          currentStatements +=
            "clav:df_" +
            classeId +
            ' clav:dfValor "' +
            df.replace(/\n/, "") +
            '" .\n';
        if (notasDF)
          currentStatements +=
            "clav:df_" + classeId + ' clav:dfNota "' + notasDF + '" .\n';
      }
    });
    return currentStatements;
  } else {
    throw "PGD: Erro a proccessar " + file + " (Leg não existente)";
  }
}

function constructPGDLCO(worksheet, file, stats, code, columns, entidades) {
  //Carregar as Legislações
  let leg = State.getLegislacoes();
  //Carregar as Entidades
  let ents = State.getEntidades();

  var ano = parseInt(file.split("_")[3]);
  if (ano < 2000) ano -= 1900;
  var legId = file.split("_")[2] + "/" + ano;

  var legislacao = leg.filter(
    (l) => l.tipo == "Portaria" && l.numero == legId
  )[0];
  if (legislacao) {
    var pais = [];
    var n = 0;
    code.codigo = "pgd_lc_" + legislacao.id;
    var currentStatements =
      "\n###  http://jcr.di.uminho.pt/m51-clav#pgd_lc_" + legislacao.id + "\n";
    currentStatements +=
      "clav:pgd_lc_" + legislacao.id + " rdf:type owl:NamedIndividual ,\n";
    currentStatements += "\t\tclav:PGD ;\n";
    currentStatements +=
      "\tclav:eRepresentacaoDe clav:" + legislacao.id + " ;\n";

    var entidade = ents.some((e) => e.sigla == entidades[0])
      ? "ent_" + entidades[0]
      : "tip_" + entidades[0];

    currentStatements += "\tclav:temEntidade clav:" + entidade + " .\n";

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1) return;
      var codigo = row.getCell(columns.codigos).text || "";
      var referencia = row.getCell(columns.nRef).text || "";
      var nivel = row.getCell(columns.nivel).value || "";
      var titulo = row.getCell(columns.titulos).text || "";
      var descricao = row.getCell(columns.descricao).text || "";
      var dono = row.getCell(columns.donos).text || "";
      var participante = row.getCell(columns.participantes).text || "";
      var pca = row.getCell(columns.pca).value || "";
      var notasPCA = row.getCell(columns.notaPCA).text || "";
      var formaContagem = row.getCell(columns.formaContagem).text || "";
      var df = row.getCell(columns.df).text || "";
      var notasDF = row.getCell(columns.notaDF).text || "";

      titulo = titulo.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      descricao = descricao.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      notasPCA = notasPCA.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      notasDF = notasDF.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');

      var classeId = "classe_" + nanoid() + "_pgd_" + legislacao.id;
      currentStatements +=
        "\n###  http://jcr.di.uminho.pt/m51-clav#" + classeId + "\n";
      currentStatements +=
        "clav:" + classeId + " rdf:type owl:NamedIndividual ,\n";
      currentStatements += "\t\tclav:Classe_PGD ;\n";
      currentStatements +=
        "\tclav:pertencePGD clav:pgd_lc_" + legislacao.id + " ;\n";
      //Quando nivel é 1 necessita reiniciar a identificação de pai
      if (nivel == 1) {
        pais = [];
        pais.push(classeId);
        n = nivel;
      } else if (nivel > n) {
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      } else if (n == nivel) {
        pais.pop();
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      } else {
        var nPops = n - nivel + 1;
        for (var i = 0; i < nPops; i++) pais.pop();
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      }
      if (codigo) {
        currentStatements += '\tclav:codigo "' + codigo + '" ;\n';
        stats.processos++;
      }
      if (referencia)
        currentStatements += '\tclav:referencia "' + referencia + '" ;\n';
      if (titulo) currentStatements += '\tclav:titulo "' + titulo + '" ;\n';
      if (descricao)
        currentStatements += '\tclav:descricao "' + descricao + '" ;\n';
      if (dono) {
        currentStatements += "\tclav:temDono clav:" + entidade + " ;\n";
        stats.donos++;
      }
      if (participante) {
        currentStatements += "\tclav:temParticipante clav:" + entidade + " ;\n";
        stats.participantes++;
      }
      if (formaContagem) {
        if (formaContagem == "F04")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_conclusaoProcedimento ;\n";
        else if (formaContagem == "F02")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_inicioProcedimento ;\n";
        else if (formaContagem == "F03")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_emissaoTitulo ;\n";
        else if (formaContagem == "F05")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_cessacaoVigencia ;\n";
        else if (formaContagem == "F06")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_extincaoEntidade ;\n";
        else if (formaContagem == "F07")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_extincaoDireito ;\n";
        else {
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_disposicaoLegal ;\n";
          currentStatements +=
            "\tclav:pcaSubformaContagem clav:vc_pcaSubformaContagem_" +
            formaContagem +
            ";\n";
        }
      }
      currentStatements += "\tclav:nivel " + nivel + " .\n";

      currentStatements += `clav:${legislacao.id} clav:temClasse clav:${classeId} .\n`;

      if (pca || notasPCA) {
        currentStatements +=
          "clav:" + classeId + " clav:temPCA clav:pca_" + classeId + " .\n";
        currentStatements +=
          "\n###  http://jcr.di.uminho.pt/m51-clav#pca_" + classeId + "\n";
        currentStatements += "clav:pca_" + classeId + " a clav:PCA .\n";
        if (pca && pca != "Não aplicável")
          if (codigo == "400.10.001") {
            let pcas = pca.split("#");
            pcas[pcas.length - 1] == "" ? pcas.pop() : "";
            pcas.map(
              (p) =>
                (currentStatements +=
                  "clav:pca_" + classeId + " clav:pcaValor " + p + " .\n")
            );
          } else {
            currentStatements +=
              "clav:pca_" + classeId + " clav:pcaValor " + pca + " .\n";
          }
        if (notasPCA)
          currentStatements +=
            "clav:pca_" + classeId + ' clav:pcaNota "' + notasPCA + '" .\n';
      }
      if (df || notasDF) {
        currentStatements +=
          "clav:" + classeId + " clav:temDF clav:df_" + classeId + " .\n";
        currentStatements +=
          "\n###  http://jcr.di.uminho.pt/m51-clav#df_" + classeId + "\n";
        currentStatements += "clav:df_" + classeId + " a clav:DestinoFinal .\n";
        if (df)
          currentStatements +=
            "clav:df_" + classeId + ' clav:dfValor "' + df + '" .\n';
        if (notasDF)
          currentStatements +=
            "clav:df_" + classeId + ' clav:dfNota "' + notasDF + '" .\n';
      }
    });
    return currentStatements;
  } else {
    throw "PGD/LC: Erro a proccessar " + file + " (Leg não existente)";
  }
}

function constructPGDLCP(worksheet, file, stats, code, columns, entidades) {
  //Carregar as Legislações
  let leg = State.getLegislacoes();
  //Carregar as Entidades
  let ents = State.getEntidades();

  var ano = parseInt(file.split("_")[3]);
  if (ano < 2000) ano -= 1900;
  var legId = file.split("_")[2] + "/" + ano;

  var legislacao = leg.filter(
    (l) => l.tipo == "Portaria" && l.numero == legId
  )[0];
  if (legislacao) {
    var pais = [];
    var n = 0;
    code.codigo = "pgd_lc_" + legislacao.id;
    var currentStatements =
      "\n###  http://jcr.di.uminho.pt/m51-clav#pgd_lc_" + legislacao.id + "\n";
    currentStatements +=
      "clav:pgd_lc_" + legislacao.id + " rdf:type owl:NamedIndividual ,\n";
    currentStatements += "\t\tclav:PGD ;\n";

    entidades = entidades.map((ent) => {
      return ents.some((e) => e.sigla == ent) ? "ent_" + ent : "tip_" + ent;
    });

    currentStatements += entidades
      .map((e) => "\tclav:temEntidade clav:" + e + " ;\n")
      .reduce((prev, ent) => prev + ent);

    currentStatements +=
      "\tclav:eRepresentacaoDe clav:" + legislacao.id + " .\n";

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1) return;
      var codigo = row.getCell(columns.codigos).text || "";
      var referencia = row.getCell(columns.nRef).text || "";
      var nivel = row.getCell(columns.nivel).value || "";
      var titulo = row.getCell(columns.titulos).text || "";
      var descricao = row.getCell(columns.descricao).text || "";
      var dono = row.getCell(columns.donos).text || "";
      var participante = row.getCell(columns.participantes).text || "";
      var pca = row.getCell(columns.pca).value || "";
      var notasPCA = row.getCell(columns.notaPCA).text || "";
      var formaContagem = row.getCell(columns.formaContagem).text || "";
      var df = row.getCell(columns.df).text || "";
      var notasDF = row.getCell(columns.notaDF).text || "";

      titulo = titulo.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      descricao = descricao.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      notasPCA = notasPCA.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');
      notasDF = notasDF.replace(/\r?\n|\r/g, " ").replace(/["]/g, '\\"');

      var classeId = "classe_" + nanoid() + "_pgd_" + legislacao.id;
      currentStatements +=
        "\n###  http://jcr.di.uminho.pt/m51-clav#" + classeId + "\n";
      currentStatements +=
        "clav:" + classeId + " rdf:type owl:NamedIndividual ,\n";
      currentStatements += "\t\tclav:Classe_PGD ;\n";
      currentStatements +=
        "\tclav:pertencePGD clav:pgd_lc_" + legislacao.id + " ;\n";
      //Quando nivel é 1 necessita reiniciar a identificação de pai
      if (nivel == 1) {
        pais = [];
        pais.push(classeId);
        n = nivel;
      } else if (nivel > n) {
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      } else if (n == nivel) {
        pais.pop();
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      } else {
        var nPops = n - nivel + 1;
        for (var i = 0; i < nPops; i++) pais.pop();
        currentStatements +=
          "\tclav:temPai clav:" + pais[pais.length - 1] + " ;\n";
        pais.push(classeId);
        n = nivel;
      }
      if (codigo) {
        currentStatements += '\tclav:codigo "' + codigo + '" ;\n';
        stats.processos++;
      }
      if (referencia)
        currentStatements += '\tclav:referencia "' + referencia + '" ;\n';
      if (titulo) currentStatements += '\tclav:titulo "' + titulo + '" ;\n';
      if (descricao)
        currentStatements += '\tclav:descricao "' + descricao + '" ;\n';
      if (dono) {
        let donos = dono.split("#");
        donos[donos.length - 1] == "" ? donos.pop() : "";
        donos.map(
          (d) =>
            (currentStatements +=
              "\tclav:temDono clav:ent_" + d.replace(/\s*/g, "") + " ;\n")
        );
        stats.donos++;
      }
      if (participante) {
        let participantes = participante.split("#");
        participantes[participantes.length - 1] == ""
          ? participantes.pop()
          : "";
        participantes.map(
          (p) =>
            (currentStatements +=
              "\tclav:temParticipante clav:ent_" +
              p.replace(/\s*/g, "") +
              ";\n")
        );
        stats.participantes++;
      }
      if (formaContagem) {
        if (formaContagem == "F04")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_conclusaoProcedimento ;\n";
        else if (formaContagem == "F02")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_inicioProcedimento ;\n";
        else if (formaContagem == "F03")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_emissaoTitulo ;\n";
        else if (formaContagem == "F05")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_cessacaoVigencia ;\n";
        else if (formaContagem == "F06")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_extincaoEntidade ;\n";
        else if (formaContagem == "F07")
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_extincaoDireito ;\n";
        else {
          currentStatements +=
            "\tclav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_disposicaoLegal ;\n";
          currentStatements +=
            "\tclav:pcaSubformaContagem clav:vc_pcaSubformaContagem_" +
            formaContagem +
            ";\n";
        }
      }
      currentStatements += "\tclav:nivel " + nivel + " .\n";

      currentStatements += `clav:${legislacao.id} clav:temClasse clav:${classeId} .\n`;
      if (pca || notasPCA) {
        currentStatements +=
          "clav:" + classeId + " clav:temPCA clav:pca_" + classeId + " .\n";
        currentStatements +=
          "\n###  http://jcr.di.uminho.pt/m51-clav#pca_" + classeId + "\n";
        currentStatements += "clav:pca_" + classeId + " a clav:PCA .\n";
        if (pca && pca != "Não aplicável")
          if (codigo == "400.10.001") {
            let pcas = pca.split("#");
            pcas[pcas.length - 1] == "" ? pcas.pop() : "";
            pcas.map(
              (p) =>
                (currentStatements +=
                  "clav:pca_" + classeId + " clav:pcaValor " + p + " .\n")
            );
          } else {
            currentStatements +=
              "clav:pca_" + classeId + " clav:pcaValor " + pca + " .\n";
          }
        if (notasPCA)
          currentStatements +=
            "clav:pca_" + classeId + ' clav:pcaNota "' + notasPCA + '" .\n';
      }
      if (df || notasDF) {
        currentStatements +=
          "clav:" + classeId + " clav:temDF clav:df_" + classeId + " .\n";
        currentStatements +=
          "\n###  http://jcr.di.uminho.pt/m51-clav#df_" + classeId + "\n";
        currentStatements += "clav:df_" + classeId + " a clav:DestinoFinal .\n";
        if (df)
          currentStatements +=
            "clav:df_" + classeId + ' clav:dfValor "' + df + '" .\n';
        if (notasDF)
          currentStatements +=
            "clav:df_" + classeId + ' clav:dfNota "' + notasDF + '" .\n';
      }
    });
    return currentStatements;
  } else {
    throw "PGD/LC: Erro a proccessar " + file + " (Leg não existente)";
  }
}

function constructTSO(worksheet, columns, start, obj, stats) {
  for (let i = start + 1; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i).values;
    const p = {};

    if (/^\s*[xX]\s*$/g.test(parseCell(row[columns.donos]))) {
      p.dono = true;
      stats.donos++;
    } else {
      p.dono = false;
    }

    let tipPart = parseCell(row[columns.participantes]);
    if (tipPart) {
      tipPart = tipPart.replace(/\s*/g, "");
      p.participante = tipPart;
      stats.participantes++;
    } else {
      p.participante = "NP";
    }

    if (p.dono || p.participante != "NP") {
      p.codigo = parseCell(row[columns.codigos]).replace(/\s*/g, "");
      p.titulo = parseCell(row[columns.titulos]).replace(
        /^\s*(\S.*\S)\s*$/g,
        "$1"
      );

      stats.processos++;
      obj.push(p);
    }
  }
}

function constructTSP(worksheet, columns, start, obj, stats) {
  for (let i = start + 1; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i).values;
    const p = {
      entidades: [],
    };

    let donos = parseCell(row[columns.donos]);
    if (donos != null) {
      donos = donos.split("#");
      for (let dono of donos) {
        let index = -1;
        dono = dono.replace(/\s*/g, "");

        for (let w = 0; w < p.entidades.length && index == -1; w++) {
          if (p.entidades[w].sigla == dono) {
            index = w;
          }
        }

        if (index == -1) {
          index = p.entidades.length;
          p.entidades.push({ sigla: dono });
        }

        p.entidades[index].dono = true;
        p.entidades[index].participante = "NP";
        stats[dono].donos++;
      }
    }

    let parts = parseCell(row[columns.participantes]);
    if (parts != null) {
      parts = parts.split("#");
      const tipo_part = parseCell(row[columns.tipo_participacao]).split("#");

      for (let j = 0; j < parts.length; j++) {
        let index = -1;
        parts[j] = parts[j].replace(/\s*/g, "");
        tipo_part[j] = tipo_part[j].replace(/\s*/g, "");

        for (let w = 0; w < p.entidades.length && index == -1; w++) {
          if (p.entidades[w].sigla == parts[j]) {
            index = w;
          }
        }

        if (index == -1) {
          index = p.entidades.length;
          p.entidades.push({ sigla: parts[j] });
        }

        if (p.entidades[index].dono == null) {
          p.entidades[index].dono = false;
        }

        p.entidades[index].participante = tipo_part[j];
        stats[parts[j]].participantes++;
      }
    }

    if (p.entidades.length > 0) {
      p.codigo = parseCell(row[columns.codigos]).replace(/\s*/g, "");
      p.titulo = parseCell(row[columns.titulos]).replace(
        /^\s*(\S.*\S)\s*$/g,
        "$1"
      );
      p.edited = true;

      for (let w = 0; w < p.entidades.length; w++) {
        stats[p.entidades[w].sigla].processos++;
      }

      obj.push(p);
    }
  }
}

SelTabs.criarPedidoDoCSV = async function (
  workbook,
  email,
  entidade_user,
  entidades_ts,
  tipo_ts,
  designacao,
  fonteL,
  file
) {
  entidades_ts = JSON.parse(entidades_ts);
  const aux = await findSheet(workbook, tipo_ts, fonteL, entidades_ts, file);
  const sheetN = aux[0];
  const rowHeaderN = aux[1];
  const columns = aux[2];
  const ents_tips = aux[3];
  const worksheet = workbook.worksheets[sheetN];
  const obj = {};
  let stats = {};
  const list = [];
  if (fonteL == "TS/LC") {
    if (tipo_ts == "TS Organizacional") {
      stats = {
        processos: 0,
        donos: 0,
        participantes: 0,
      };

      constructTSO(worksheet, columns, rowHeaderN, list, stats);

      obj.ts = {
        designacao,
        processos: list,
        entidade: entidades_ts[0],
      };
    } else {
      obj.entidades = [];
      ents_tips.forEach((e) => {
        stats[e.sigla] = {
          processos: 0,
          donos: 0,
          participantes: 0,
        };

        obj.entidades.push({
          sigla: e.sigla,
          designacao: e.designacao,
          label: `${e.sigla} - ${e.designacao}`,
        });
      });

      constructTSP(worksheet, columns, rowHeaderN, list, stats);
      obj.designacao = designacao;
      obj.listaProcessos = {
        procs: list,
      };
    }

    /*
    let pedido = {
      tipoPedido: "Criação",
      tipoObjeto: tipo_ts,
      novoObjeto: obj,
      user: { email },
      // Adiciona a entidade do utilizador criador do pedido
      entidade: entidade_user,
    };

    pedido = await Pedidos.criar(pedido);*/
    return obj;
  } else if (fonteL == "PGD/LC") {
    if (tipo_ts == "TS Organizacional") {
      stats = {
        processos: 0,
        donos: 0,
        participantes: 0,
      };
      var code = { codigo: "" };
      let pgd = constructPGDLCO(
        worksheet,
        file,
        stats,
        code,
        columns,
        entidades_ts.split()
      );
      let parts = partRequest(pgd, 0);

      for (i in parts) {
        try {
          await execQuery("update", `INSERT DATA {${parts[i]}}`);
        } catch (err) {
          throw "Insucesso na inserção do tabela de seleção\n" + err;
        }
      }
      await State.loadLegislacao(code.codigo.split("pgd_lc_")[1]);
      return { codigo: code.codigo, stats };
    } else {
      stats = {
        processos: 0,
        donos: 0,
        participantes: 0,
      };
      var code = { codigo: "" };
      let pgd = constructPGDLCP(
        worksheet,
        file,
        stats,
        code,
        columns,
        entidades_ts
      );
      let parts = partRequest(pgd, 0);

      for (i in parts) {
        try {
          await execQuery("update", `INSERT DATA {${parts[i]}}`);
        } catch (err) {
          throw "Insucesso na inserção do tabela de seleção\n" + err;
        }
      }
      await State.loadLegislacao(code.codigo.split("pgd_lc_")[1]);

      return { codigo: code.codigo, stats };
    }
  } else if (fonteL == "PGD") {
    stats = {
      processos: 0,
    };
    var code = { codigo: "" };
    let pgd = constructPGD(
      worksheet,
      file,
      stats,
      code,
      columns,
      !Array.isArray(entidades_ts) ? entidades_ts.split() : entidades_ts
    );
    let parts = partRequest(pgd, 0);

    for (i in parts) {
      try {
        await execQuery("update", `INSERT DATA {${parts[i]}}`);
      } catch (err) {
        throw "Insucesso na inserção do tabela de seleção\n" + err;
      }
    }
    await State.loadLegislacao(code.codigo.split("pgd_")[1]);
    return { codigo: code.codigo, stats };
  } else if (fonteL == "RADA") {
    if (tipo_ts == "TS Organizacional") {
      stats = {
        processos: 0,
      };
      var code = { codigo: "" };
      let rada = constructRADAO(
        worksheet,
        file,
        stats,
        code,
        columns,
        entidades_ts.split()
      );
      let parts = partRequest(rada, 0);

      for (i in parts) {
        try {
          await execQuery("update", `INSERT DATA {${parts[i]}}`);
        } catch (err) {
          throw "Insucesso na inserção do tabela de seleção\n" + err;
        }
      }
      await State.loadLegislacao(code.codigo.split("tsRada_")[1]);
      return { codigo: code.codigo, stats };
    }
  }
};

function partRequest(req, parts) {
  let pgdParts = [];
  let prev = 0;
  // Partição feita automáticamente quando o argumento parts é = 0
  if (parts === 0) {
    let div = Math.floor(req.split(/\r\n|\r|\n/).length / 10000);
    req.length;
    req.spilt;

    if (div > 0) {
      for (var i = 0; i < div; i++) {
        let mid = Math.floor(req.length / (div - i) - 1);
        let index;
        for (index = mid; index < req.length; index++) {
          if (/#/g.test(req[index + 1]) && /\r\n|\n|\r/g.test(req[index]))
            break;
        }

        pgdParts.push(req.slice(prev, index));
        prev = index;
      }
    } else {
      pgdParts.push(req);
    }
  } else {
    for (var i = 0; i < parts; i++) {
      let mid = Math.floor(req.length / (parts - i)) - 1;
      let index;
      for (index = mid; index < req.length; index++) {
        if (/#/g.test(req[index + 1]) && /(\r\n|\n|\r)/g.test(req[index]))
          break;
      }

      prev != index ? pgdParts.push(req.slice(prev, index)) : "";
      prev = index;
      // Caso o número de partes pedida é superior ao valor de partições possíveis no ficheiro
      if (index == req.length - 1) break;
    }
  }

  return pgdParts;
}

function queryClasse(id, proc) {
  const idProc = `c${proc.codigo}_${id}`;

  let query = "";
  query += `
        clav:${idProc} a clav:Classe_N${proc.codigo.split(".").length} ;
                       clav:pertenceTS clav:${id} ;
                       clav:classeStatus "${proc.status}" ;
                       clav:codigo "${proc.codigo}" ;
                       clav:titulo "${proc.titulo}" ;
                       clav:descricao "${proc.descricao
                         .replace(/(\r\n|\n|\r)/gm, "")
                         .replace(/"/g, '\\"')}" .
    `;
  if (proc.procTrans) {
    query += `
            clav:${idProc} clav:processoTransversal "${proc.procTrans}" .
        `;
  }
  if (proc.tipoProc == "Processo Comum") {
    query += `
            clav:${idProc} clav:processoTipoVC clav:vc_processoTipo_pc .
        `;
  } else {
    query += `
            clav:${idProc} clav:processoTipoVC clav:vc_processoTipo_pe .
        `;
  }

  for (nota of proc.notasAp) {
    const nano = nanoid();
    var notaId = `na_${idProc}_${nano}`;
    query += `
            clav:${idProc} clav:temNotaAplicacao clav:${notaId} .
            clav:${notaId} a clav:NotaAplicacao ;
                        clav:conteudo "${nota.nota.replace(/"/g, '\\"')}" .
        `;
  }

  for (var nota of proc.exemplosNotasAp) {
    const nano = nanoid();
    var notaId = `exna_${idProc}_${nano}`;
    query += `
            clav:${idProc} clav:temExemploNA clav:${notaId} .
            clav:${notaId} a clav:ExemploNotaAplicacao ;
                        clav:conteudo "${nota.exemplo.replace(/"/g, '\\"')}" .
        `;
  }

  for (var nota of proc.notasEx) {
    const nano = nanoid();
    var notaId = `ne_${idProc}_${nano}`;
    query += `
            clav:${idProc} clav:temNotaExclusao clav:${notaId} .
            clav:${notaId} a clav:NotaExclusao ;
                        clav:conteudo "${nota.nota.replace(/"/g, '\\"')}" .
        `;
  }

  for (const ti of proc.termosInd) {
    const nano = nanoid();
    const tiId = `ti_${nano}`;
    query += `
            clav:${tiId} a clav:TermoIndice ;
                         clav:estado "Ativo" ;
                         clav:termo "${ti.termo}" ;
                         clav:estaAssocClasse clav:${idProc} .
        `;
  }

  for (const leg of proc.legislacao) {
    query += `
            clav:${idProc} clav:temLegislacao clav:${leg.idLeg} .
        `;
  }

  if (proc.pca.valores != "" || proc.pca.notas != "") {
    const pcaId = `pca_${idProc}`;
    query += `
            clav:${idProc} clav:temPCA clav:${pcaId} .
            clav:${pcaId} a clav:PCA ;
                        clav:pcaValor "${
                          !isNaN(proc.pca.valores) ? proc.pca.valores : "NE"
                        }" .
        `;
    if (proc.pca.formaContagem == "Data de cessação da vigência") {
      query += `
                clav:${pcaId} clav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_cessacaoVigencia .
            `;
    } else if (proc.pca.formaContagem == "Data de conclusão do procedimento") {
      query += `
                clav:${pcaId} clav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_conclusaoProcedimento .
            `;
    } else if (proc.pca.formaContagem == "Conforme disposição legal") {
      query += `
                clav:${pcaId} clav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_disposicaoLegal .
            `;
      if (
        proc.pca.subFormaContagem ==
        "Data do último assento, respeitando 30 anos para o óbito, 50 anos para o casamento e 100 anos para o nascimento, nos termos do artigo 15.º da Lei n.º 324/2007"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.01 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data do cumprimento nos termos do artigo 26.º da Lei n.º 5/2008"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.02 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data da defesa da tese de doutoramento, nos termos do artigo 3.º do Decreto-Lei n.º 52/2002 ou da data do cancelamento prevista no n.º 5 do artigo 5.º da Portaria n.º 285/2015"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.03 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data do facto que ocorrer em primeiro lugar; a) com o registo da extinção da procuração a que digam respeito; b) decorridos 15 anos a contar da data da outorga da procuração; c) logo que deixem de ser estritamente necessários para os fins para que foram recolhidos, nos termos do n.º 1 do artigo 13.º do Decreto Regulamentar n.º 3/2009"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.04 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data em que a autorização de introdução no mercado deixe de existir, nos termos do n.º 2 do artigo 12.º do Regulamento de execução (UE) n.º 520/2012"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.05 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        'Data da prescrição do procedimento criminal para os inquéritos arquivados nos termos do n.º 2 do artigo 277.º, do n.º 3 do artigo 282.º e do n.º 1 do artigo 277.º do Decreto-Lei n.º 78/87 atualizado e para os inquéritos arquivados com fundamento na recolha de "prova bastante de se não ter verificado o crime", ou "de o arguido não o ter praticado a qualquer título"; data do arquivamento para os inquéritos arquivados com fundamento na inadmissibilidade do procedimento ou outro, nos termos do n.º 1 do artigo 277.º e do n.º 1 do artigo 280.º do Decreto-Lei n.º 78/87 atualizado."'
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.06 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data em que os jovens a quem respeitam completarem 21 anos, nos termos do artigo 132.º da Lei n.º 166/99"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.07 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data da prescrição do procedimento criminal, nos termos do artigo 118.º do Decreto-Lei n.º 48/95"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.08 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data em que forem considerados findos para efeitos de arquivo, nos termos do artigo 142.º da Lei n.º 63/2013"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.09 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data do cancelamento definitivo do registo criminal, nos termos do artigo 11.º da Lei n.º 37/2015"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.10 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        "Data em que o jovem atinja a maioridade ou, nos casos em que tenha solicitado a continuação da medida para além da maioridade, complete 21 anos ou até aos 25 anos de idade, nos termos da Lei n.º 147/99, alterada pela Lei n.º 23/2017"
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.11 .
                `;
      } else if (
        proc.pca.subFormaContagem ==
        'Maior de idade: data do cancelamento definitivo do registo criminal, nos termos do artigo 11.º da Lei n.º 37/2015; Menor de idade: data em que o respectivo titular completar 21 anos, nos termos do artigo 220.º da Lei n.º 4/2015" - Sempre que as formas de contagem de prazos estipuladas nas alíneas c) e e) do n.º 6 não forem aplicáveis, por o título não ser emitido ou por não se iniciar o período de vigência, compete às entidades previstas no artigo 2.º proceder ao encerramento das agregações, em conformidade com o código do procedimento administrativo, dando início à contagem do prazo de conservação administrativa'
      ) {
        query += `
                    clav:${pcaId} clav:pcaSubformaContagem clav:vc_pcaSubformaContagem_F01.12 .
                `;
      }
    } else if (proc.pca.formaContagem == "Data de emissão do título") {
      query += `
                clav:${pcaId} clav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_emissaoTitulo .
            `;
    } else if (proc.pca.formaContagem == "Data de extinção do direito") {
      query += `
                clav:${pcaId} clav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_extincaoDireito .
            `;
    } else if (
      proc.pca.formaContagem ==
      "Data de extinção da entidade sobre a qual recai o procedimento"
    ) {
      query += `
                clav:${pcaId} clav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_extincaoEntidade .
            `;
    } else if (proc.pca.formaContagem == "Data de início do procedimento") {
      query += `
                clav:${pcaId} clav:pcaFormaContagemNormalizada clav:vc_pcaFormaContagem_inicioProcedimento .
            `;
    }

    if (proc.pca.nota) {
      query += `
                clav:${pcaId} clav:pcaNota clav:${proc.pca.nota} .
            `;
    }
    if (proc.pca.justificacao) {
      query += `
                clav:${pcaId} clav:temJustificacao clav:just_${pcaId} .
                clav:just_${pcaId} a clav:JustificacaoPCA .
            `;
    }
    var justIndex = 1;
    for (var just of proc.pca.justificacao) {
      query += `
                clav:just_${pcaId} clav:temCriterio clav:crit_just_${pcaId}_${justIndex} .
                clav:crit_just_${pcaId}_${justIndex} a clav:${just.tipoId} ;
                                                    clav:conteudo "${just.conteudo.replace(
                                                      /"/g,
                                                      '\\"'
                                                    )}" .
            `;
      justIndex++;
    }
  }
  if ((proc.df.valor != "" && proc.df.valor != "NE") || proc.df.nota) {
    const dfId = `df_${idProc}`;
    query += `
            clav:${idProc} clav:temDF clav:${dfId} .
            clav:${dfId} a clav:DestinoFinal ;
                        clav:dfValor "${proc.df.valor}" .
        `;
    if (proc.df.justificacao) {
      query += `
                clav:${dfId} clav:temJustificacao clav:just_${dfId} .
                clav:just_${dfId} a clav:JustificacaoDF .
            `;
    }
    justIndex = 1;
    for (var just of proc.df.justificacao) {
      query += `
                clav:just_${dfId} clav:temCriterio clav:crit_just_${dfId}_${justIndex} .
                clav:crit_just_${dfId}_${justIndex} a clav:${just.tipoId} ;
                                                    clav:conteudo "${just.conteudo.replace(
                                                      /"/g,
                                                      '\\"'
                                                    )}" .
            `;
      justIndex++;
    }
  }
  if (proc.codigo.split(".").length == 4) {
    query += `
            clav:${idProc} clav:temPai clav:${`c${proc.codigo.split(".")[0]}.${
      proc.codigo.split(".")[1]
    }.${proc.codigo.split(".")[2]}_ts${idProc.split("_ts")[1]}`} .
        `;
  }
  if (proc.codigo.split(".").length == 3) {
    query += `
            clav:${idProc} clav:temPai clav:${`c${proc.codigo.split(".")[0]}.${
      proc.codigo.split(".")[1]
    }_ts${idProc.split("_ts")[1]}`} .
        `;
  }
  if (proc.codigo.split(".").length == 2) {
    query += `
            clav:${idProc} clav:temPai clav:${`c${
      proc.codigo.split(".")[0]
    }_ts${idProc.split("_ts")[1]}`} .
        `;
  }

  return query;
}

SelTabs.adicionar = async function (tabela, leg) {
  const currentTime = new Date();
  const paiList = [];
  const queryNum = `
        select * where {
            ?ts a clav:TabelaSelecao .
        }
    `;
  try {
    let resultNum = await execQuery("query", queryNum);
    resultNum = normalize(resultNum);
    const num =
      resultNum.length == 0
        ? "1"
        : parseInt(resultNum[resultNum.length - 1].ts.split("ts")[1]) + 1;
    const id = `ts${num}`;
    const data = `${currentTime.getFullYear()}-${
      currentTime.getMonth() + 1
    }-${currentTime.getDate()}`;
    let entID = "";
    if (tabela.objeto.tipo === "TS Pluriorganizacional") {
      var query = `{
            clav:${id} a clav:TabelaSelecao ;
                          clav:designacao "${tabela.objeto.dados.designacao}" ;
                          clav:tsResponsavel "${tabela.criadoPor}" ;
                          clav:dataAprovacao "${data}" ;
                          clav:eRepresentacaoDe clav:${leg} ;
                          clav:temEntidadeResponsavel clav:${tabela.entidade} .
        `;

      for (var ent of tabela.objeto.dados.entidades) {
        query += `
                clav:${id} clav:temEntidade clav:${ent.id} .
            `;
      }

      for (var proc of tabela.objeto.dados.listaProcessos.procs) {
        // Escreve os triplos do proc
        query += queryClasse(id, proc);

        var idProc = `c${proc.codigo}_${id}`;
        for (var processo of proc.processosRelacionados) {
          if (
            tabela.objeto.dados.listaProcessos.procs.find(
              (e) => e.codigo == processo.codigo
            )
          ) {
            var idProcAux = `c${processo.codigo}_${id}`;
            query += `
                        clav:${idProc} clav:${processo.idRel} clav:${idProcAux} .
                    `;
          }
        }
        // Definição de participação das entidades
        for (var ent of proc.entidades) {
          if (ent.dono) {
            query += `
                        clav:${idProc} clav:temDono clav:${ent.id} .
                        clav:c${proc.codigo} clav:temDono clav:${ent.id} .
                    `;
          }

          if (ent.participante != "NP") {
            query += `
                        clav:${idProc} clav:temParticipante${ent.participante} clav:${ent.id} .
                        clav:c${proc.codigo} clav:temParticipante${ent.participante} clav:${ent.id} .
                    `;
          }
        }
        // Adiciona à lista de pais com nivel N1
        if (paiList.indexOf(proc.codigo.split(".")[0]) === -1) {
          paiList.push(proc.codigo.split(".")[0]);
        }
        // Adiciona à lista de pois com nivel N2
        if (
          paiList.indexOf(
            `${proc.codigo.split(".")[0]}.${proc.codigo.split(".")[1]}`
          ) === -1
        ) {
          paiList.push(
            `${proc.codigo.split(".")[0]}.${proc.codigo.split(".")[1]}`
          );
        }
        // Adicona à lista os filhos
        var listaFilhos = await Classe.descendencia(`c${proc.codigo}`);
        // Escreve os triplos dos proc filhos
        for (var filho of listaFilhos) {
          var classeFilho = await Classe.retrieve(`c${filho.codigo}`);
          query += queryClasse(id, classeFilho);
        }
      }
      // Escreve os triplos dos proc pais
      for (var pai of paiList) {
        var classePai = await Classe.retrieve(`c${pai}`);
        query += queryClasse(id, classePai);
      }
      query += `
        }
        `;
    } else {
      var query = `{
                clav:${id} a clav:TabelaSelecao ;
                              clav:designacao "${tabela.objeto.dados.ts.designacao}" ;
                              clav:tsResponsavel "${tabela.criadoPor}" ;
                              clav:dataAprovacao "${data}" ;
                              clav:eRepresentacaoDe clav:${leg} ;
                              clav:temEntidadeResponsavel clav:${tabela.entidade} .
            `;
      if (tabela.objeto.dados.ts.idEntidade) {
        entID = tabela.objeto.dados.ts.idEntidade;
      } else if (tabela.objeto.dados.ts.idTipologia) {
        entID = tabela.objeto.dados.ts.idTipologia;
      }

      query += `
                    clav:${id} clav:temEntidade clav:${entID} .
                `;

      for (var proc of tabela.objeto.dados.ts.listaProcessos.procs) {
        // Escreve os triplos do proc

        query += queryClasse(id, proc);

        var idProc = `c${proc.codigo}_${id}`;
        for (var processo of proc.processosRelacionados) {
          if (
            tabela.objeto.dados.ts.listaProcessos.procs.find(
              (e) => e.codigo == processo.codigo
            )
          ) {
            var idProcAux = `c${processo.codigo}_${id}`;
            query += `
                            clav:${idProc} clav:${processo.idRel} clav:${idProcAux} .
                        `;
          }
        }
        // Definição de participação das entidades

        if (proc.dono) {
          query += `
                            clav:${idProc} clav:temDono clav:${entID} .
                            clav:c${proc.codigo} clav:temDono clav:${entID} .
                        `;
        }

        if (proc.participante != "NP") {
          query += ` clav:${idProc} clav:temParticipante${proc.participante} clav:${entID} .
                            clav:c${proc.codigo} clav:temParticipante${proc.participante} clav:${entID} .
                        `;
        }

        // Adiciona à lista de pais com nivel N1
        if (paiList.indexOf(proc.codigo.split(".")[0]) === -1) {
          paiList.push(proc.codigo.split(".")[0]);
        }
        // Adiciona à lista de pois com nivel N2
        if (
          paiList.indexOf(
            `${proc.codigo.split(".")[0]}.${proc.codigo.split(".")[1]}`
          ) === -1
        ) {
          paiList.push(
            `${proc.codigo.split(".")[0]}.${proc.codigo.split(".")[1]}`
          );
        }
        // Adicona à lista os filhos
        var listaFilhos = await Classe.descendencia(`c${proc.codigo}`);
        // Escreve os triplos dos proc filhos
        for (var filho of listaFilhos) {
          var classeFilho = await Classe.retrieve(`c${filho.codigo}`);
          query += queryClasse(id, classeFilho);
        }
      }
      // Escreve os triplos dos proc pais
      for (var pai of paiList) {
        var classePai = await Classe.retrieve(`c${pai}`);
        query += queryClasse(id, classePai);
      }
      query += `
            }
            `;
    }

    const inserir = `INSERT DATA ${query}`;

    const ask = `ASK {
            clav:${id} a clav:TabelaSelecao ;
                clav:tsResponsavel "${tabela.criadoPor}" ;
                clav:dataAprovacao "${data}" ;
                clav:temEntidadeResponsavel clav:${tabela.entidade} .
            }
        `;

    return execQuery("update", inserir).then((res) =>
      execQuery("query", ask).then((result) => {
        if (result.boolean)
          return { msg: "Sucesso na inserção da tabela de seleção", id };

        execQuery("delete", `DELETE DATA ${query}`);
        throw "Insucesso na inserção do tabela de seleção";
      })
    );
  } catch (erro) {
    throw erro;
  }
};
