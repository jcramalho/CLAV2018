const client = require('../../config/database').onthology;
const Excel = require('exceljs/modern.nodejs');

var Pedidos = require('../../controllers/api/pedidos');
var SelTabs = module.exports

SelTabs.list = function () {
    return client.query(
        `SELECT * WHERE { 
            ?id rdf:type clav:TabelaSelecao ;
                clav:designacao ?Name ;
                clav:referencialClassificativoStatus 'A';
        }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.listClasses = function (table) {
    var listQuery = `
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


    return client.query(listQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.classChildren = function (parent, table) {
    var fetchQuery = `
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

    return client.query(fetchQuery)
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.stats = function (id) {
    return client.query(
        `SELECT * WHERE { 
                clav:${id} rdf:type clav:TabelaSelecao ;
                    clav:designacao ?Name .
            }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.createTab = function (id, name, classes, criteriaData) {

    var createQuery = `
            INSERT DATA {
                clav:${id} rdf:type owl:NamedIndividual ,
                        clav:TabelaSelecao ;
                    clav:referencialClassificativoStatus 'H';
                    clav:designacao '${name} ${name=="Teste" ? id.replace("ts_", "") : ""}' .
        `;

    for (let clas of classes) {
        let clasID = id + '_' + clas.id.value.replace(/[^#]+#(.*)/, '$1');

        let level = clas.Codigo.value.split('.').length;

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
                clav:${clasID} clav:temPai clav:${id + '_' + clas.Pai.value.replace(/[^#]+#(.*)/, '$1')} .
            `;
        }

        var keyVal = {
            ProcTrans: 'processoTransversal',
            Descricao: 'descricao',
            Titulo: 'titulo'
        };

        for (const key in keyVal) {
            if (clas[key]) {
                createQuery += `
                    clav:${clasID} clav:${keyVal[key]} "${clas[key].value.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
                `;
            }
        }

        if (clas.Exemplos.value) {
            for (let val of clas.Exemplos.value.split('%%')) {
                createQuery += `
                    clav:${clasID} clav:exemploNA "${val.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
                `;
            }
        }

        var keyMultVal = {
            ProcTipo: 'processoTipoVC',
            Donos: 'temDono',
            Parts1: 'temParticipanteApreciador',
            Parts2: 'temParticipanteAssessor',
            Parts3: 'temParticipanteComunicador',
            Parts4: 'temParticipanteDecisor',
            Parts5: 'temParticipanteExecutor',
            Parts6: 'temParticipanteIniciador',
            Diplomas: 'temLegislacao',
        }

        for (const key in keyMultVal) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    createQuery += `
                        clav:${clasID} clav:${keyMultVal[key]} clav:${val.replace(/[^#]+#(.*)/, '$1')} .
                    `;
                }
            }
        }


        var keyNotes = {
            NotasA: 'temNotaAplicacao',
            NotasE: 'temNotaExclusao',
        }

        for (const key in keyNotes) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    val = val.split('::');
                    noteID = val[0].replace(/[^#]+#(n[ae]_)(.*)/, `$1${id}_$2`); 

                    createQuery += `
                        clav:${noteID} rdf:type owl:NamedIndividual,
                                clav:clav:${keyNotes[key].slice(3)};
                            clav:conteudo "${val[1].replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}".
                        clav:${clasID} clav:${keyNotes[key]} clav:${noteID} .
                    `;
                }
            }
        }
        
        var keyRels = {
            Rels1: 'eSintetizadoPor',
            Rels2: 'eSinteseDe',
            Rels3: 'eComplementarDe',
            Rels4: 'eCruzadoCom',
            Rels5: 'eSuplementoPara',
            Rels6: 'eSucessorDe',
            Rels7: 'eAntecessorDe',
        }

        for (const key in keyRels) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    createQuery += `
                        clav:${clasID} clav:${keyRels[key]} clav:${id + "_" + val.replace(/[^#]+#(.*)/, '$1')} .
                    `;
                }
            }
        }


        if(level>=3 && clas.DFvalor){
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

            if(clas.PCAcontagem && clas.PCAcontagem.value){
                createQuery+= `
                    clav:pca_${clasID} clav:pcaFormaContagemNormalizada clav:${clas.PCAcontagem.value.replace(/[^#]+#(.*)/, '$1')} .
                `;
            }
            if(clas.PCAsubcontagem && clas.PCAsubcontagem.value){
                createQuery+= `
                    clav:pca_${clasID} clav:pcaSubformaContagem clav:${clas.PCAsubcontagem.value.replace(/[^#]+#(.*)/, '$1')} .
                `;
            }
            if(clas.PCAvalor && clas.PCAvalor.value){
                createQuery+= `
                    clav:pca_${clasID} clav:pcaValor '${clas.PCAvalor.value}' .
                `;
            }
            if(clas.DFvalor && clas.DFvalor.value){
                createQuery+= `
                    clav:df_${clasID} clav:dfValor '${clas.DFvalor.value}' .
                `;
            }
        }
        let critCount={
            pca:0,
            df:0   
        };
        let critsToRemove = [];
        for(let [critIndex,crit] of criteriaData.entries()){
            let critID = crit.id.value.replace(/[^#]+#(.*)/, '$1');
            let pID = critID.replace(/.*(c[0-9]{3}\.[0-9]{2}.[0-9]{3}).*/,'$1');
            let critCat = critID.replace(/crit_just_([^_]*)_.*/,'$1');

            if(pID == clas.id.value.replace(/[^#]+#(.*)/, '$1')){
                let n = critCount[critCat];
                critCount[critCat]++;

                createQuery += `
                    clav:crit_just_${critCat}_${clasID}_${n} rdf:type clav:${crit.Tipo.value.replace(/[^#]+#(.*)/, '$1')} ,
                            owl:NamedIndividual .

                    clav:just_${critCat}_${clasID} clav:temCriterio clav:crit_just_${critCat}_${clasID}_${n} .
                `;
                
                if(crit.Conteudo.value){
                    createQuery += `
                        clav:crit_just_${critCat}_${clasID}_${n} clav:conteudo "${crit.Conteudo.value.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
                    `;
                }
                if(crit.Legislacao.value){
                    for(let dip of crit.Legislacao.value.split('###')){
                        createQuery += `
                            clav:crit_just_${critCat}_${clasID}_${n} clav:temLegislacao clav:${dip.replace(/[^#]+#(.*)/, '$1')} .
                        `;
                    }
                }
                if(crit.Processos.value){
                    for(let proc of crit.Processos.value.split('###')){
                        createQuery += `
                            clav:crit_just_${critCat}_${clasID}_${n} clav:temProcessoRelacionado clav:${proc.replace(/[^#]+#(.*)/, '$1')} .
                        `;
                    }
                }
                critsToRemove.push(critIndex);
            }
        }    
        /*for(let i of critsToRemove.sort().reverse()){
            criteriaData.splice(i,1);
        }   */ 
    }

    createQuery += "}"

    //console.log(createQuery);

    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));
}

SelTabs.deleteTab = function (id) {
    var delQuery = `
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

    return client.query(delQuery).execute()
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.trueDelete = function (id) {
    var delQuery = `
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
}

function hasXs(worksheet, row, reX){
    var len = row.length
    var ret = false
    var reDP = new RegExp("Dono|Participante", "g")

    for(var i=2; i < len && !ret; i++){
        if(reDP.test(row[i])){
            var c = worksheet.getColumn(i).values
            var cLen = c.length
            
            for(var j=1; j < cLen && !ret; j++){
                if(reX.test(c[j])){
                    ret = true
                }
            }
        }
    }

    return ret
}

//Descobrir onde está a tabela de onde se obtém os valores
function findSheet(workbook, reX){
    var sheetN = null
    var rowHeaderN = null
    var founded = false

    workbook.eachSheet((worksheet, sheetId) => {
        var rC = worksheet.rowCount

        if(!founded && rC > 0 && worksheet.state == 'visible'){
            for(var j=1; j <= rC && !founded; j++){
                var row = worksheet.getRow(j).values

                if(row[1] == 'Código' && hasXs(worksheet, row, reX)){
                    sheetN = sheetId
                    rowHeaderN = j
                    founded = true
                }
            }
        }
    })

    return [sheetN, rowHeaderN, founded]
}

function parseHeaders(worksheet, rowHeaderN, columns, entidades){
    var headers = worksheet.getRow(rowHeaderN).values
    var typeOrg = null

    for(var i = 2; i < headers.length; i++){
        if(headers[i].startsWith('Dono')){

            typeOrg = "TS Organizacional"
            columns.push({type: "dono", value: i})

        }else if(headers[i].startsWith('Participante')){

            typeOrg = "TS Organizacional"
            columns.push({type: "participante", value: i})

        }else if(headers[i].includes('Dono')){

            typeOrg = "TS Pluriorganizacional"
            var entidade = headers[i].split(' Dono')[0]
            columns.push({type: "dono", entidade: entidade, value: i})

            if(entidades.indexOf(entidade) == -1){
                entidades.push(entidade)
            }

        }else if(headers[i].includes('Participante')){

            typeOrg = "TS Pluriorganizacional"
            var entidade = headers[i].split(' Participante')[0]
            columns.push({type: "participante", entidade: entidade, value: i})

            if(entidades.indexOf(entidade) == -1){
                entidades.push(entidade)
            }
        }
    }

    return typeOrg
}

function constructObj(worksheet, codigos, start, c, obj, reX){
    var column = worksheet.getColumn(c.value).values

    for(var i = start + 1; i < worksheet.rowCount; i++){
        if(reX.test(column[i])){
            obj.push(codigos[i].replace(/\r|\n/g,""))
        }
    }
}

SelTabs.criarPedidoDoCSV = function (workbook, email) {
    var reX = new RegExp("^\s*[x|X]\s*$", "g")
    var aux = findSheet(workbook, reX)
    var sheetN = aux[0]
    var rowHeaderN = aux[1]
    var founded = aux[2]

    if(founded){
        var worksheet = workbook.getWorksheet(sheetN)
        var columns = [] 
        var entidades = []

        var typeOrg = parseHeaders(worksheet, rowHeaderN, columns, entidades)

        if(typeOrg != null){
            var obj

            if(typeOrg == "TS Organizacional"){
                obj = {
                    donos: [],
                    participantes: []
                }
            }else{
                obj = {}
                
                entidades.forEach(e => {
                    obj[e] = {
                        donos: [],
                        participantes: []
                    }
                })
            }

            var codigos = worksheet.getColumn(1).values

            if(typeOrg == "TS Organizacional"){
                columns.forEach(c => {
                    constructObj(worksheet, codigos, rowHeaderN, c, obj[c.type + "s"], reX)
                })
            }else{
                columns.forEach(c => {
                    constructObj(worksheet, codigos, rowHeaderN, c, obj[c.entidade][c.type + "s"], reX)
                })
            }

            var pedido = {
                tipoPedido: "Criação",
                tipoObjeto: typeOrg,
                novoObjeto: obj,
                user: {email: email}
            }
            
            console.log(JSON.stringify(pedido))
            return Promise.resolve(pedido)//Pedidos.criar(pedido)
        }else{
            throw("Não contém informação suficiente para criar a tabela de seleção.")
        }
    }else{
        throw("Não foi encontrado informação por forma a criar a tabela de seleção.")
    }
}
