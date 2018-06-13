var classe = new Vue({
    el: '#classe-form',
    data: {
        message: "",
        delConfirm: false,
        id: "",
        orgList: [],
        participantLists: {
            Apreciador: [],
            Assessor: [],
            Comunicador: [],
            Decisor: [],
            Iniciador: [],
            Executor: [],
        },
        legList: [],
        classRelList: [],
        relationsSelected: [],
        relationTypes: [
            {
                label: 'Antecessor de',
                value: 'eAntecessorDe'
            },
            {
                label: 'Sucessor de',
                value: 'eSucessorDe',
            },
            {
                label: 'Complementar de',
                value: 'eComplementarDe',
            },
            {
                label: 'Cruzado com',
                value: 'eCruzadoCom',
            },
            {
                label: 'Sintese de',
                value: 'eSinteseDe',
            },
            {
                label: 'Sintetizado por',
                value: 'eSintetizadoPor',
            },
            {
                label: 'Suplemento de',
                value: 'eSuplementoDe',
            },
            {
                label: 'Suplemento para',
                value: 'eSuplementoPara',
            }
        ],

        clas: {
            Title: "",
            Children: "",
            Code: "",
            Parent: {
                id: "",
                code: "",
                title: "",
            },
            Status: "",
            Desc: "",
            ProcType: "",
            ProcTrans: "",
            Owners: [],
            Legs: [],
            AppNotes: [],
            DelNotes: [],
            Indexes: [],
            RelProcs: [],
            Participants: [],
            PCA: {
                formacontagem: "",
                contagemnormalizada: "",
                notas: [],
                valores: [],
                criterios: [],
            },
            DF: {
                valores: [],
                criterios: [],
            },
        },
        newClass: {
            Title: "",
            Status: "",
            Desc: "",
            ProcType: "",
            ProcTrans: "",
            Owners: [],
            Leg: "",
            Legs: [],
            ExAppNotes: [],
            AppNotes: [],
            DelNotes: [],
            Indexes: [],
            RelProc: "",
            RelType: "",
            RelProcs: {
                'Antecessor De': [],
                'Complementar De': [],
                'Cruzado Com': [],
                'Sintese De': [],
                'Sintetizado Por': [],
                'Sucessor De': [],
                'Suplemento De': [],
                'Suplemento Para': []
            },
            Participants: {
                Apreciador: [],
                Assessor: [],
                Comunicador: [],
                Decisor: [],
                Executor: [],
                Iniciador: [],
            },
        },
        edit: {
            Title: false,
            Status: false,
            Desc: false,
            ProcType: false,
            ProcTrans: false,
            Owners: false,
            Legs: false,
            ExAppNotes: false,
            AppNotes: false,
            DelNotes: false,
            Indexes: false,
            RelProcs: false,
            Participants: false,
        },

        orgsReady: false,
        ownersReady: false,
        legListReady: false,
        legsReady: false,
        exAppNotesReady: false,
        appNotesReady: false,
        delNotesReady: false,
        classesReady: false,
        relProcsReady: false,
        pageReady: false,

        participationsDic: {
            Apreciador: "Apreciar",
            Assessor: "Assessorar",
            Comunicador: "Comunicar",
            Decisor: "Decidir",
            Executor: "Executar",
            Iniciador: "Iniciar"
        },

        nEdits: 0,
    },
    components: {
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
        spinner: VueStrap.spinner,
        tabs: VueStrap.tabs,
        tabGroup: VueStrap.tabGroup,
        tab: VueStrap.tab,
    },
    watch: {
        relationsSelected: {
            deep: true,
            handler: function(){
                
            },
        },
    },
    methods: {
        convertRelations: function () {
            for(const key in this.newClass.RelProcs){
                let type = "e"+key.replace(" ","");
                let toAdd = this.relationsSelected.filter( a=>a.relType == type );

                this.newClass.RelProcs[key] = JSON.parse(JSON.stringify(
                    toAdd.map(
                        function(pn){
                            return {
                                Code: pn.code,
                                Title: pn.name,
                                id: pn.id
                            }
                        }
                    )
                ));
            }
        },
        prepData: function (dataObj) {
            this.clas.Title = dataObj.Titulo.value;
            this.clas.Code = dataObj.Codigo.value;

            if (dataObj.Status) {
                this.clas.Status = dataObj.Status.value;
                this.newClass.Status = dataObj.Status.value;
            }
            if (dataObj.Pai) {
                this.clas.Parent.id = dataObj.Pai.value.replace(/[^#]+#(.*)/, '$1');
                this.clas.Parent.code = dataObj.CodigoPai.value;
                this.clas.Parent.title = dataObj.TituloPai.value;
            }

            this.loadChildren();

            this.pageReady = true;

            if (dataObj.Desc) {
                this.clas.Desc = dataObj.Desc.value;
                this.newClass.Desc = dataObj.Desc.value;
            }

            this.loadExAppNotes();
            this.loadAppNotes();
            this.loadDelNotes();
            this.loadIndexes();

            if (this.clas.Level == 3) {

                if (dataObj.ProcTipo) {
                    this.clas.ProcType = dataObj.ProcTipo.value;
                    this.newClass.ProcType = dataObj.ProcTipo.value;
                }
                if (dataObj.ProcTrans) {
                    this.clas.ProcTrans = dataObj.ProcTrans.value;
                    this.newClass.ProcTrans = dataObj.ProcTrans.value;
                }

                this.loadOwners();
                this.loadParticipants();
                this.loadRelProcs();
                this.loadLegs();

                this.loadPCA();
                this.loadDF();
            }

        },
        loadIndexes: function () {
            var indexesToParse = [];
            var keys = ["id", "Termo"];

            this.$http.get("/api/termosIndice/filtrar/" + this.id)
                .then(function (response) {
                    indexesToParse = response.body;
                })
                .then(function () {
                    if (indexesToParse[0])
                        this.clas.Indexes = this.parse(indexesToParse, keys);
                    this.newClass.Indexes = JSON.parse(JSON.stringify(this.clas.Indexes));
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadChildren: function () {
            var classesToParse = [];
            var keys = ["Child", "Code", "Title"];

            this.$http.get("/api/classes/" + this.id + "/descendencia")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    if (classesToParse[0].Code)
                        this.clas.Children = this.parse(classesToParse, keys)
                            .sort((a, b) => a.Code.localeCompare(b.Code));
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadOrgs: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla", "Nome", "Tipo"];
            var i = 0;

            this.$http.get("/api/organizacoes")
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    conj = new RegExp("#Conjunto", "g");
                    tipol = new RegExp("#Tipologia", "g");

                    this.orgList = this.parse(orgsToParse, keys)
                        .map(function (item) {
                            if (conj.test(item.Tipo)) {
                                item.Tipo = "Conjunto";
                            }
                            else if (tipol.test(item.Tipo)) {
                                item.Tipo = "Tipologia";
                            }
                            else {
                                item.Tipo = "Organização";
                            }
                            return item;
                        })
                        .map(function (item) {
                            return {
                                data: [i++, item.Sigla, item.Nome, item.Tipo],
                                selected: false,
                                id: item.id
                            }
                        }).sort(function (a, b) {
                            return a.data[1].localeCompare(b.data[1]);
                        });

                    for (let type in this.participantLists) {
                        if (type != "Executor") {
                            this.participantLists[type] = JSON.parse(
                                JSON.stringify(this.orgList)
                            );
                        }
                    }
                    this.orgsReady = true;

                    let ownersSelected = this.clas.Owners.map(a => a.id);

                    this.orgList = this.orgList.map(function (item) {
                        item.selected = (ownersSelected.indexOf(item.id) != -1);
                        return item;
                    });

                    this.participantLists.Executor = JSON.parse(
                        JSON.stringify(this.orgList.filter(a => a.selected))
                    );

                    for (let type in this.participantLists) {
                        let partsSelected = this.clas.Participants[type].map(a => a.id);

                        this.participantLists[type].map(function (item) {
                            item.selected = (partsSelected.indexOf(item.id) != -1);
                            return item;
                        });
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadOwners: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla", "Nome"];

            this.$http.get("/api/classes/" + this.id + "/donos")
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    this.clas.Owners = JSON.parse(JSON.stringify(this.parse(orgsToParse, keys)));
                    this.newClass.Owners = JSON.parse(JSON.stringify(this.parse(orgsToParse, keys)));


                    this.ownersReady = true;
                    this.loadParticipants();
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadLegList: function () {
            var legsToParse = [];
            var keys = ["id", "Número", "Titulo", "Tipo", "Data"];
            var i = 0;

            this.$http.get("/api/legislacao")
                .then(function (response) {
                    legsToParse = response.body;
                })
                .then(function () {
                    let completeList = this.parse(legsToParse, keys);

                    let selectedLegs = this.clas.Legs.map(a=>a.id);
                    this.legList = completeList
                        .map(function (item) {
                            return {
                                data: [i++, item.Tipo, item.Número, item.Titulo, item.Data],
                                selected: selectedLegs.indexOf(item.id)!=-1,
                                id: item.id
                            }
                        });

                    /*this.pca.criteria.legislation = JSON.parse(
                        JSON.stringify(this.legList)
                    );
                    this.df.criteria.legislation = JSON.parse(
                        JSON.stringify(this.legList)
                    );*/

                    this.legListReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadLegs: function () {
            var legsToParse = [];
            var keys = ["id", "Tipo", "Número", "Titulo"];

            this.$http.get("/api/classes/" + this.id + "/legislacao")
                .then(function (response) {
                    legsToParse = response.body;
                })
                .then(function () {
                    this.clas.Legs = JSON.parse(JSON.stringify(this.parse(legsToParse, keys)));
                    this.newClass.Legs = JSON.parse(JSON.stringify(this.parse(legsToParse, keys)));

                    this.legsReady = true;
                    this.loadLegList();
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadAppNotes: function () {
            var notesToParse = [];
            var keys = ["id", "Nota"];

            this.$http.get("/api/classes/" + this.id + "/notasAp")
                .then(function (response) {
                    notesToParse = response.body;
                })
                .then(function () {
                    this.clas.AppNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));
                    this.newClass.AppNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));

                    this.appNotesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadDelNotes: function () {
            var notesToParse = [];
            var keys = ["id", "Nota"];

            this.$http.get("/api/classes/" + this.id + "/notasEx")
                .then(function (response) {
                    notesToParse = response.body;
                })
                .then(function () {
                    this.clas.DelNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));
                    this.newClass.DelNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));

                    this.clas.DelNote = this.clas.DelNotes.map(
                        a => a.Nota = a.Nota.replace(
                            /([0-9]{3}(\.?[0-9]+)*)/g,
                            '<a href="/classes/consultar/c$1">$1</a>'
                        )
                    );

                    this.delNotesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadExAppNotes: function () {
            var notesToParse = [];
            var keys = ["Exemplo"];

            this.$http.get("/api/classes/" + this.id + "/exemplosNotasAp")
                .then(function (response) {
                    notesToParse = response.body;
                })
                .then(function () {
                    this.clas.ExAppNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));
                    this.newClass.ExAppNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));

                    this.exAppNotesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadClasses: function () {
            this.ready = false;
            let content = [];

            this.$http.get("/api/classes/filtrar")
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {
                    let relsSelected = this.relationsSelected.map(a => a.code);

                    let classList = [];
                    classList = this.parseClasses(content, relsSelected);

                    this.classRelList = JSON.parse(
                        JSON.stringify(classList)
                    );

                    /*this.pca.criteria.classes = JSON.parse(
                        JSON.stringify(classList)
                    );

                    this.df.criteria.classes = JSON.parse(
                        JSON.stringify(classList)
                    );*/

                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseClasses: function (dataToParse, selectedPNs) {
            var destination = [];
            const indexes = {};
            let avo;
            let pai;

            for (let pn of dataToParse) {
                let codeAvo = pn.AvoCodigo.value;
                let indexesAvo = indexes[codeAvo];
                let codePai = pn.PaiCodigo.value;

                let pnSelected = false;
                if (selectedPNs && selectedPNs.length) {
                    pnSelected = selectedPNs.indexOf(pn.PNCodigo.value) != -1;
                }


                if (indexesAvo) {
                    avo = indexesAvo.i;

                    if (indexesAvo.sub[codePai] != undefined) {
                        pai = indexesAvo.sub[codePai];
                    }
                    else {
                        pai = Object.keys(indexesAvo.sub).length;

                        indexes[codeAvo].sub[codePai] = pai;

                        let infoPai = {
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai, pn.PaiTitulo.value],
                            drop: false,
                            selected: pnSelected,
                            subReady: true,
                            sublevel: []
                        }
                        destination[avo].sublevel.push(infoPai);
                    }
                }
                else {
                    avo = Object.keys(indexes).length;
                    pai = 0;

                    indexes[codeAvo] = { i: avo, sub: {} };
                    indexes[codeAvo].sub[codePai] = pai;

                    let infoAvo = {
                        codeID: pn.Avo.value.replace(/[^#]+#(.*)/, '$1'),
                        content: [codeAvo, pn.AvoTitulo.value],
                        drop: false,
                        selected: pnSelected,
                        subReady: true,
                        sublevel: [{
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai, pn.PaiTitulo.value],
                            drop: false,
                            selected: pnSelected,
                            subReady: true,
                            sublevel: [],
                        }]
                    }
                    destination.push(infoAvo);
                }

                let pninfo = {
                    codeID: pn.PN.value.replace(/[^#]+#(.*)/, '$1'),
                    content: [pn.PNCodigo.value, pn.PNTitulo.value],
                    drop: false,
                    selected: pnSelected,
                }

                if (pn.Filhos.value.length) {
                    pninfo.subReady = true;
                    pninfo.sublevel = [];

                    for (let filho of pn.Filhos.value.split('###')) {
                        let filhoInfo = filho.split(':::');

                        pninfo.sublevel.push({
                            codeID: filhoInfo[0].replace(/[^#]+#(.*)/, '$1'),
                            content: [filhoInfo[1], filhoInfo[2]],
                            drop: false,
                            selected: pnSelected,
                        });
                    }
                }
                destination[avo].sublevel[pai].sublevel.push(pninfo);
            }

            return destination;
        },
        loadRelProcs: function () {
            var relProcsToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/classes/" + this.id + "/relacionados")
                .then(function (response) {
                    relProcsToParse = response.body;
                })
                .then(function () {
                    this.clas.RelProcs = JSON.parse(JSON.stringify(this.parseRelations(relProcsToParse, keys)));
                    this.relationsSelected = JSON.parse(
                        JSON.stringify(
                            this.parseRelationsSelected(relProcsToParse)
                                .sort((a, b) => a.code.localeCompare(b.code))
                        )
                    );

                    this.relProcsReady = true;

                    this.loadClasses();
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseRelationsSelected: function (content) {
            let selected = [];
            for (let pn of content) {
                selected.push({
                    code: pn.Code.value,
                    id: pn.id.value.replace(/[^#]+#(.*)/, '$1'),
                    name: pn.Title.value,
                    relType: pn.Type.value.replace(/[^#]+#(.*)/, '$1')
                });
            }
            return selected;
        },
        parseRelations: function (content, keys) {
            var dest = {
                'Antecessor De': [],
                'Complementar De': [],
                'Cruzado Com': [],
                'Sintese De': [],
                'Sintetizado Por': [],
                'Sucessor De': [],
                'Suplemento De': [],
                'Suplemento Para': []
            };
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {

                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }
                var type = content[i].Type.value.replace(/.*#e(.*)/, '$1').replace(/([a-z])([A-Z])/, '$1 $2');

                dest[type].push(JSON.parse(JSON.stringify(temp)));
            }

            return dest;
        },
        loadParticipants: function () {
            var participantsToParse = [];
            var keys = ['id', 'Nome', 'Sigla'];

            this.$http.get("/api/classes/" + this.id + "/participantes")
                .then(function (response) {
                    participantsToParse = response.body;
                })
                .then(function () {
                    this.clas.Participants = this.parseParticipants(participantsToParse, keys);
                    this.newClass.Participants = JSON.parse(JSON.stringify(this.clas.Participants));

                    this.participantsReady = true;

                    this.loadOrgs();
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseParticipants: function (content, keys) {
            var dest = {
                Apreciador: [],
                Assessor: [],
                Comunicador: [],
                Decisor: [],
                Executor: [],
                Iniciador: [],
            };
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {

                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }
                var type = content[i].Type.value.replace(/.*temParticipante(.*)/, '$1');

                dest[type].push(JSON.parse(JSON.stringify(temp)));
            }

            return dest;
        },
        loadPCA: function () {
            var infoToParse = [];

            this.$http.get("/api/classes/" + this.id + "/pca")
                .then(function (response) {
                    infoToParse = response.body;
                })
                .then(function () {
                    this.clas.PCA = this.parsePCA(infoToParse);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parsePCA: function (data) {

            let PCA = {
                formacontagem: "",
                subContagem: "",
                notas: [],
                valores: [],
                criterios: [],
            }

            if (data.SubContagem) {
                PCA.subContagem = data.SubContagem.value;
            }

            if (data.ContagemNorm) {
                PCA.contagemnormalizada = data.ContagemNorm.value;
            }

            if (data.Notas.value) {
                PCA.notas = data.Notas.value.split('###');
            }

            if (data.Valores.value) {
                PCA.valores = data.Valores.value.split('###');
            }

            if (data.Criterios.value[0].Tipo) {
                for (let criterio of data.Criterios.value) {
                    let newCrit = {
                        tipo: "",
                        nota: "",
                        processos: [],
                        legislacao: []
                    }

                    let critTypes = {
                        CriterioJustificacaoComplementaridadeInfo: "Critério Complementaridade Informacional",
                        CriterioJustificacaoUtilidadeAdministrativa: "Critério Utilidade Administrativa",
                        CriterioJustificacaoLegal: "Critério Legal",
                        CriterioJustificacaoGestionario: "Critério Gestionário",
                        CriterioJustificacaoDensidadeInfo: "Critério Densidade Informacional",
                    }

                    newCrit.tipo = critTypes[criterio.Tipo.value.replace(/[^#]+#(.*)/, '$1')];

                    newCrit.nota = criterio.Conteudo.value;

                    if (criterio.Processos.value) {
                        for (let proc of criterio.Processos.value.split('###')) {
                            proc = proc.split(':::');

                            let id = proc[0].replace(/[^#]+#(.*)/, '$1');
                            let codigo = proc[1];
                            let titulo = proc[2];

                            newCrit.processos.push({
                                id: id,
                                codigo: codigo,
                                titulo: titulo
                            });

                            let regex = new RegExp(codigo, "gi");
                            newCrit.nota = newCrit.nota
                                .replace(regex, "<a href='/classes/consultar/" + id + "'>" + codigo + "</a>");
                        }
                    }

                    if (criterio.Legislacao.value) {
                        for (let doc of criterio.Legislacao.value.split('###')) {
                            doc = doc.split(':::');

                            let id = doc[0].replace(/[^#]+#(.*)/, '$1');
                            let tipo = doc[1];
                            let numero = doc[2];

                            newCrit.legislacao.push({
                                id: doc[0].replace(/[^#]+#(.*)/, '$1'),
                                tipo: doc[1],
                                numero: doc[2]
                            })

                            let regex = new RegExp("\\[([^\\]]*" + numero + ")\\]", "gi");

                            newCrit.nota = newCrit.nota
                                .replace(regex, "<a href='/legislacao/consultar/" + id + "'>$1</a>");
                        }
                    }

                    PCA.criterios.push(newCrit);
                }
            }

            return PCA;
        },
        loadDF: function () {
            var infoToParse = [];

            this.$http.get("/api/classes/" + this.id + "/df")
                .then(function (response) {
                    infoToParse = response.body;
                })
                .then(function () {
                    this.clas.DF = this.parseDF(infoToParse);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseDF: function (data) {
            let DF = {
                valores: [],
                criterios: [],
            }

            if (data.Valores.value) {
                DF.valores = data.Valores.value.split('###');

                for (let [index, valor] of DF.valores.entries()) {
                    if (valor == "C") {
                        valor = "Conservação";
                    }
                    else if (valor == "E") {
                        valor = "Eliminação";
                    }
                    else if (valor == "CP") {
                        valor = "Conservação Parcial";
                    }
                    else if (valor == "NE") {
                        valor = data.Nota.value;
                    }
                    DF.valores[index] = valor;
                }
            }

            if (data.Criterios.value[0].Tipo) {
                for (let criterio of data.Criterios.value) {
                    let newCrit = {
                        tipo: "",
                        nota: "",
                        processos: [],
                        legislacao: []
                    }

                    let critTypes = {
                        CriterioJustificacaoComplementaridadeInfo: "Critério Complementaridade Informacional",
                        CriterioJustificacaoUtilidadeAdministrativa: "Critério Utilidade Administrativa",
                        CriterioJustificacaoLegal: "Critério Legal",
                        CriterioJustificacaoGestionario: "Critério Gestionário",
                        CriterioJustificacaoDensidadeInfo: "Critério Densidade Informacional",
                    }

                    newCrit.tipo = critTypes[criterio.Tipo.value.replace(/[^#]+#(.*)/, '$1')];

                    newCrit.nota = criterio.Conteudo.value;

                    if (criterio.Processos.value) {
                        for (let proc of criterio.Processos.value.split('###')) {
                            proc = proc.split(':::');

                            let id = proc[0].replace(/[^#]+#(.*)/, '$1');
                            let codigo = proc[1];
                            let titulo = proc[2];

                            newCrit.processos.push({
                                id: id,
                                codigo: codigo,
                                titulo: titulo
                            });

                            let regex = new RegExp(codigo, "gi");
                            newCrit.nota = newCrit.nota
                                .replace(regex, "<a href='/classes/consultar/" + id + "'>" + codigo + "</a>");
                        }
                    }

                    if (criterio.Legislacao.value) {
                        for (let doc of criterio.Legislacao.value.split('###')) {
                            doc = doc.split(':::');

                            let id = doc[0].replace(/[^#]+#(.*)/, '$1');
                            let tipo = doc[1];
                            let numero = doc[2];

                            newCrit.legislacao.push({
                                id: doc[0].replace(/[^#]+#(.*)/, '$1'),
                                tipo: doc[1],
                                numero: doc[2]
                            })

                            let regex = new RegExp("\\[([^\\]]*" + numero + ")\\]", "gi");

                            newCrit.nota = newCrit.nota
                                .replace(regex, "<a href='/legislacao/consultar/" + id + "'>$1</a>");
                        }
                    }

                    DF.criterios.push(newCrit);
                }
            }

            return DF;
        },
        parse: function (content, keys) {
            var dest = [];
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }

                dest[i] = JSON.parse(JSON.stringify(temp));
            }

            return dest;
        },
        /*remOwner: function (index) {
            this.newClass.Owners.splice(index, 1);
        },*/
        addLeg: function (leg) {
            this.newClass.Legs.push(leg);
        },
        remLeg: function (index) {
            this.legList.push(this.newClass.Legs[index]);
            this.newClass.Legs.splice(index, 1);
        },
        newNoteID: function (noteList, prefix) {
            function checkID(id, list) {
                for (let item of list) {
                    if (id == item.id.replace(/[nt][aei](_.*)?_([0-9]+)/, '$2')) {
                        return false;
                    }
                }
                return true;
            }

            var newID = 1;
            if (noteList && noteList.length) {
                for (let note of noteList) {
                    var appID = parseInt(note.id.replace(/[nt][aei](_.*)?_([0-9]+)/, '$2'));

                    if (newID != appID) {
                        if (checkID(newID, noteList)) {
                            break;
                        }
                    }
                    newID++;
                }
                while (!checkID(newID, noteList)) {
                    newID++;
                }
            } else {
                newID = noteList.length + 1;
            }
            return prefix + "_" + this.id + "_" + newID;
        },
        /*addParticipant: function (type, participant) {
            this.newClass.Participants[type].push(participant);
        },
        remParticipant: function (type, index) {
            this.newClass.Participants[type].splice(index, 1);
        },
        addRelation: function (type, relation) {
            this.newClass.RelProcs[type].push(relation);
        },
        remRelation: function (key, index) {
            this.newClass.RelProcs[key].splice(index, 1);
        },
        addRelProc: function (proc) {
            this.newClass.RelProcs.push(proc);
        },
        remRelProc: function (index) {
            this.newClass.RelProcs.splice(index, 1);
        },*/
        readyToUpdate: function () {
            var keys = Object.keys(this.edit);

            for (var i = 0; i < keys.length; i++) {
                if (this.edit[keys[i]] && this.newClass[keys[i]] != this.clas[keys[i]]) {
                    return true;
                }
            }

            if (this.edit.Participants) {
                var keys = Object.keys(this.clas.Participants);

                for (var i = 0; i < keys.length; i++) {
                    if (this.newClass.Participants[keys[i]] != this.clas.Participants[keys[i]]) {
                        return true;
                    }
                }
            }

        },
        legSelected: function(row, list){
            var findIndex = function (list, id) {
                for (let [index, item] of list.entries()) {
                    if (id == item.id) {
                        return index;
                    }
                }
                return -1;
            }

            if (!row.selected) {
                list.push(row);
            }
            else {
                let index = findIndex(list, row.id);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
        },
        orgSelected: function (row, list, type) {
            var findIndex = function (list, id) {
                for (let [index, item] of list.entries()) {
                    if (id == item.id) {
                        return index;
                    }
                }
                return -1;
            }

            if (!row.selected) {
                if (type == 'dono') {
                    list.push(
                        JSON.parse(JSON.stringify(row))
                    );
                    this.participantLists.Executor.push(
                        JSON.parse(JSON.stringify(row))
                    );
                }
                else {
                    let data = {
                        Nome: row.data[2],
                        Sigla: row.data[1],
                        id: row.id,
                    }
                    list.push(data);
                }
            }
            else {
                let index = findIndex(list, row.id);

                if (index != -1) {
                    list.splice(index, 1);

                    if (type == 'dono') {
                        let orgIndex = findIndex(this.participantLists.Executor, row.id);

                        if (orgIndex != -1) {
                            this.participantLists.Executor.splice(index, 1);
                        }

                        let selectedIndex = findIndex(this.newClass.Participants.Executor, row.id);

                        if (selectedIndex != -1) {
                            this.newClass.Participants.Executor.splice(selectedIndex, 1);
                        }
                    }
                }
            }
        },
        pnRelSelected(payload) {
            var row = payload.rowData;

            if (!row.selected) {
                let newPN = {
                    name: row.content[1],
                    code: row.content[0],
                    id: row.codeID,
                    relType: {
                        value: null,
                        label: 'Tipo de Relação'
                    }
                };

                this.relationsSelected.push(newPN);

                this.relationsSelected.sort(
                    function (a, b) {
                        return a.code.localeCompare(b.code);
                    }
                );
            }

            else {
                let index = 0;

                for (pn of this.relationsSelected) {
                    if (pn.id == row.codeID) {
                        break;
                    }
                    index++;
                }

                if (index < this.relationsSelected.length) {
                    this.relationsSelected.splice(index, 1);
                }
            }
        },
        subtractArray: function (from, minus) {
            var ret;

            if (!from) {
                ret = null;
            }
            else if (!minus) {
                ret = JSON.parse(JSON.stringify(from));
            }
            else {
                ret = from.filter(function (item) {
                    var r = true;
                    for (var i = 0; i < minus.length; i++) {
                        if (minus[i].id == item.id) {
                            r = false;
                            break;
                        }
                    }

                    return r;
                });
            }

            return ret;
        },
        updateClass: function () {
            this.$refs.spinner.show();
            this.message = "Updating...";

            var dataObj = {
                id: this.id,
                Title: null,
                Status: null,
                Desc: null,
                ProcType: null,
                ProcTrans: null,
                Owners: {
                    Add: null,
                    Delete: null,
                },
                Legs: {
                    Add: null,
                    Delete: null,
                },
                ExAppNotes: null,
                Indexes: null,
                AppNotes: null,
                DelNotes: null,
                RelProcs: {
                    'Antecessor De': {
                        Add: null,
                        Delete: null,
                    },
                    'Complementar De': {
                        Add: null,
                        Delete: null,
                    },
                    'Cruzado Com': {
                        Add: null,
                        Delete: null,
                    },
                    'Sintese De': {
                        Add: null,
                        Delete: null,
                    },
                    'Sintetizado Por': {
                        Add: null,
                        Delete: null,
                    },
                    'Sucessor De': {
                        Add: null,
                        Delete: null,
                    },
                    'Suplemento De': {
                        Add: null,
                        Delete: null,
                    },
                    'Suplemento Para': {
                        Add: null,
                        Delete: null,
                    },
                },
                Participants: {
                    Apreciador: {
                        Add: null,
                        Delete: null,
                    },
                    Assessor: {
                        Add: null,
                        Delete: null,
                    },
                    Comunicador: {
                        Add: null,
                        Delete: null,
                    },
                    Decisor: {
                        Add: null,
                        Delete: null,
                    },
                    Executor: {
                        Add: null,
                        Delete: null,
                    },
                    Iniciador: {
                        Add: null,
                        Delete: null,
                    },
                }
            };

            var keys = ["Title", "Status", "Desc", "ProcType", "ProcTrans", "ExAppNotes", "Indexes", "AppNotes", "DelNotes"];

            for (var i = 0; i < keys.length; i++) {
                if (this.edit[keys[i]]) {
                    dataObj[keys[i]] = this.newClass[keys[i]];
                }
            }

            var arraysKeys = ["Owners", "Legs"];

            for (var i = 0; i < arraysKeys.length; i++) {
                if (this.edit[arraysKeys[i]]) {

                    var temp = {
                        Add: null,
                        Delete: null,
                    };

                    temp.Add = this.subtractArray(this.newClass[arraysKeys[i]], this.clas[arraysKeys[i]]);
                    temp.Delete = this.subtractArray(this.clas[arraysKeys[i]], this.newClass[arraysKeys[i]]);

                    dataObj[arraysKeys[i]] = JSON.parse(JSON.stringify(temp));
                }
            }

            var participantKeys = ["Apreciador", "Assessor", "Comunicador", "Decisor", "Executor", "Iniciador"];

            if (this.edit.Participants) {
                for (var i = 0; i < participantKeys.length; i++) {

                    var temp = {
                        Add: null,
                        Delete: null,
                    };

                    temp.Add = this.subtractArray(this.newClass.Participants[participantKeys[i]], this.clas.Participants[participantKeys[i]]);
                    temp.Delete = this.subtractArray(this.clas.Participants[participantKeys[i]], this.newClass.Participants[participantKeys[i]]);

                    dataObj.Participants[participantKeys[i]] = JSON.parse(JSON.stringify(temp));
                }
            }

            var relationKeys = Object.keys(this.clas.RelProcs);

            if (this.edit.RelProcs) {
                this.convertRelations();

                for (var i = 0; i < relationKeys.length; i++) {

                    var temp = {
                        Add: null,
                        Delete: null,
                    };

                    temp.Add = this.subtractArray(this.newClass.RelProcs[relationKeys[i]], this.clas.RelProcs[relationKeys[i]]);
                    temp.Delete = this.subtractArray(this.clas.RelProcs[relationKeys[i]], this.newClass.RelProcs[relationKeys[i]]);

                    dataObj.RelProcs[relationKeys[i]] = JSON.parse(JSON.stringify(temp));
                }
            }

            console.log(dataObj);
            /*
            this.$http.put('/api/classes/'+this.id, { dataObj: dataObj },{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then(function (response) {
                this.$refs.spinner.hide();
                this.message = response.body;
                window.location.href = '/classes/consultar/'+this.id;
            })
            .catch(function (error) {
                console.error(error);
            });
            */
        },
        delReady: function () {
            this.message = "Tem a certeza que deseja apagar?";
            this.delConfirm = true;
        },
        delNotReady: function () {
            this.message = "";
            this.delConfirm = false;
        },
        deleteClass: function () {
            this.$refs.spinner.show();
            this.$http.delete('/api/classes/' + this.id)
                .then(function (response) {
                    this.$refs.spinner.hide();
                    this.message = response.body;
                    window.location.href = '/classes';
                })
                .catch(function (error) {
                    console.error(error);
                });
        }
    },
    created: function () {
        this.id = window.location.pathname.split('/')[3];
        this.clas.Level = this.id.split('.').length;

        var content;

        this.$http.get("/api/classes/" + this.id)
            .then(function (response) {
                content = response.body;
            })
            .then(function () {
                this.prepData(content[0]);
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})