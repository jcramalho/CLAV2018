var alt = new Vue({
    el: '#alteracao',
    data: {
        // Variáveis gerais da pag
        id: null,
        entidade: {
            nome: "Teste"
        },
        table:{
            subReady: {},
            header: [],
            data: [],
            ready: false,
            cwidth: ['9%','88%'],
            subTemp: [],
            nEdits: 0,
        },
        classShow: false,


        // Variáveis relativas ao modal de consulta/update das classes
        message: "",
        delConfirm: false,
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
        relationsSelectedOld: [],
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
        countTypes: [],
        subcountTypes: [],

        clas: {
            ID: "",
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
            PCA: {
                deadline: "",
                count: { label: "Forma de Contagem", id: null },
                subcount: { label: "Sub-forma de Contagem", id: null },
                criteria: [],
            },
            DF: {
                dest: "",
                criteria: [],
            }
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
            PCA: {
                value: false,
                count: false,
                just: false,
            },
            DF: {
                dest: false,
                just: false,
            }
        },
        PCA: {
            critTypes: [
                {
                    value: "CriterioJustificacaoLegal",
                    label: "Critério Legal",
                    rel: 1
                },
                {
                    value: "CriterioJustificacaoUtilidadeAdministrativa",
                    label: "Critério Utilidade Administrativa",
                    rel: 2
                },
                {
                    value: "CriterioJustificacaoGestionario",
                    label: "Critério Gestionário",
                    rel: 0
                },
            ],
        },
        DF: {
            critTypes: [
                {
                    value: "CriterioJustificacaoLegal",
                    label: "Critério Legal",
                    rel: 1
                },
                {
                    value: "CriterioJustificacaoDensidadeInfo",
                    label: "Densidade Informacional",
                    rel: 2
                },
                {
                    value: "CriterioJustificacaoComplementaridadeInfo",
                    label: "Critério Complementaridade Informacional",
                    rel: 2
                },
            ],
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
        countsReady: false,
        subcountsReady: false,
        critRelsReady: false,

        participationsDic: {
            Apreciador: "Apreciar",
            Assessor: "Assessorar",
            Comunicador: "Comunicar",
            Decisor: "Decidir",
            Executor: "Executar",
            Iniciador: "Iniciar"
        },

        nEdits: 0,
        modalMsgShow: false,
        modalMsg: "",

        autoCritIndexes: {
            utilidadeAdmin: -1,         // PCA - criterio de utilidade administrativa (rels: suplementoPara)
            densidadeInfo: -1,          // DF - criterio dansidade informaconal (rels: sinteseDe/sintetizadoPor)
            complementaridadeInfo: -1   // DF - criterio complementaridade informacional (rels: complementar de)
        },



        editedClasses: [],
    },
    components: {
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
        spinner: VueStrap.spinner,
        tabs: VueStrap.tabs,
        tabGroup: VueStrap.tabGroup,
        tab: VueStrap.tab,
        modal: VueStrap.modal,
    },
    computed: {
        relationsSelectedClone: function(){
            return JSON.parse(JSON.stringify(this.relationsSelected));
        }
    },
    watch: {
        classShow: function(){
            if(!this.classShow){
                for(const key in this.edit){
                    if(key!="PCA" && key!="DF"){
                        this.edit[key]=false;  
                    }
                }
                for(const key in this.edit.PCA){
                    this.edit.PCA[key]=false; 
                }
                for(const key in this.edit.DF){
                    this.edit.DF[key]=false; 
                }
            }
        },
        relationsSelectedClone: function(newVal, oldVal){
            this.relationsSelectedOld=JSON.parse(JSON.stringify(oldVal));
        }
    },
    methods: {
        loadTS: function(){
            var content = [];

            this.$http.get("/api/tabelasSelecao/"+this.id+"/classes")
            .then( function(response) {
                content = response.body;
            })
            .then( function() {
                this.table.data = this.parseTS(content);
                this.table.ready=true;
            })
            .catch( function(error) { 
                console.error(error); 
            });
        },
        rowClicked: function(params){
            this.$refs.spinner.show();

            this.clas.ID = params.trueID;
            this.clas.Level = params.trueID.split('.').length;

            var content;

            this.$http.get("/api/classes/" + this.clas.ID)
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {
                    console.log(content);
                    this.prepData(content[0]);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseTS: function (dataToParse) {
            var destination = [];
            const indexes = {};
            let avo;
            let pai;

            let level= this.level;
            let activeClass= this.activeClass;

            for (let pn of dataToParse) {
                let codeAvo = pn.AvoCodigo.value;
                let indexesAvo = indexes[codeAvo];
                let codePai = pn.PaiCodigo.value;

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
                        subReady: true,
                        sublevel: [{
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai, pn.PaiTitulo.value],
                            drop: false,
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
                        });
                    }
                }
                destination[avo].sublevel[pai].sublevel.push(pninfo);
            }

            return destination;
        },
        classUpdated: function(id){
            this.editedClasses.push(id);

            this.table.ready=false;
            this.loadTS(); 
        },

        
        relChanged: function(index, rel){
            if(rel.relType == "eSuplementoPara"){
                if(this.autoCritIndexes.utilidadeAdmin==-1){
                    this.edit.PCA.just=true;
                    let critIndex = -1;

                    //verificar se já existe um critério de utilidade administrativa
                    for(let [i,crit] of this.newClass.PCA.criteria.entries()){
                        if(crit.type.value=="CriterioJustificacaoUtilidadeAdministrativa"){
                            critIndex=i;

                            crit.edit=true;

                            break;
                        }
                    }

                    //se não existir criar
                    if(critIndex==-1){
                        critIndex = this.addNewCrit("PCA");

                        this.newClass.PCA.criteria[critIndex].type = {
                            value: "CriterioJustificacaoUtilidadeAdministrativa",
                            label: "Critério Utilidade Administrativa",
                            rel: 2
                        };
                    }
                    this.autoCritIndexes.utilidadeAdmin=critIndex;
                }
            }
            else if(rel.relType == "eSinteseDe" || rel.relType == "eSintetizadoPor"){
                if((rel.relType == "eSinteseDe" && this.checkIfExistsRelation("eSintetizadoPor")) || (rel.relType == "eSintetizadoPor" && this.checkIfExistsRelation("eSinteseDe"))) {
                    messageL.showMsg("Não podem existir ao mesmo tempo as relações 'Síntese De' e 'Sintetizado Por'!");
                }
                else if (rel.relType == "eSintetizadoPor" && this.checkIfExistsRelation("eComplementarDe")){
                    messageL.showMsg("Não podem existir ao mesmo tempo as relações 'Sintetizado Por' e 'Complementar De'!");
                }
                else {
                    this.edit.DF.dest=true;
                    this.newClass.DF.dest = (rel.relType == "eSinteseDe") ? "C" : "E";
                    
                    if(this.autoCritIndexes.densidadeInfo==-1){
                        this.edit.DF.just=true;
                        let critIndex = -1;

                        //verificar se já existe um critério de utilidade administrativa
                        for(let [i,crit] of this.newClass.DF.criteria.entries()){
                            if(crit.type.value=="CriterioJustificacaoDensidadeInfo"){
                                critIndex=i;

                                crit.edit=true;

                                break;
                            }
                        }

                        //se não existir criar
                        if(critIndex==-1){
                            critIndex = this.addNewCrit("DF");

                            this.newClass.DF.criteria[critIndex].type = {
                                value: "CriterioJustificacaoDensidadeInfo",
                                label: "Densidade Informacional",
                                rel: 2
                            };
                        }
                        this.autoCritIndexes.densidadeInfo=critIndex;
                    }
                }
            }
            else if(rel.relType == "eComplementarDe"){
                if(this.checkIfExistsRelation("eSintetizadoPor")){
                    messageL.showMsg("Não podem existir ao mesmo tempo as relações 'Sintetizado Por' e 'Complementar De'!");
                }
                else{
                    this.edit.DF.dest=true;
                    this.newClass.DF.dest = "C";

                    if(this.autoCritIndexes.complementaridadeInfo==-1){
                        this.edit.DF.just=true;
                        let critIndex = -1;

                        //verificar se já existe um critério de utilidade administrativa
                        for(let [i,crit] of this.newClass.DF.criteria.entries()){
                            if(crit.type.value=="CriterioJustificacaoComplementaridadeInfo"){
                                critIndex=i;

                                crit.edit=true;

                                break;
                            }
                        }

                        //se não existir criar
                        if(critIndex==-1){
                            critIndex = this.addNewCrit("DF");

                            this.newClass.DF.criteria[critIndex].type = {
                                value: "CriterioJustificacaoComplementaridadeInfo",
                                label: "Critério Complementaridade Informacional",
                                rel: 2
                            };
                        }
                        this.autoCritIndexes.complementaridadeInfo=critIndex;
                    }
                }
            }
            
            if(this.relationsSelectedOld[index].relType=="eSuplementoPara"){
                console.log("[teste] relação antes da alteração era 'Suplemento Para'");
            }
        },
        checkIfExistsRelation: function(rela) {
            for (let [i, rel] of this.relationsSelected.entries()) {
                if (rel.relType == rela) {
                    return true;
                }
            }
            return false;
        },
        convertRelations: function () {
            for (const key in this.newClass.RelProcs) {
                let type = "e" + key.replace(" ", "");
                let toAdd = this.relationsSelected.filter(a => a.relType == type);

                this.newClass.RelProcs[key] = JSON.parse(JSON.stringify(
                    toAdd.map(
                        function (pn) {
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
            this.classShow=true;
            this.$refs.spinner.hide();

            if (dataObj.Desc) {
                this.clas.Desc = dataObj.Desc.value;
                this.newClass.Desc = dataObj.Desc.value;
            }

            this.loadExAppNotes();
            this.loadAppNotes();
            this.loadDelNotes();
            this.loadIndexes();

            if (this.clas.Level >= 3) {

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

                this.loadCountTypes();
                this.loadSubCountTypes();
            }

        },
        loadCountTypes: function () {
            var dataToParse = [];
            var keys = ["id", "Label"];
            var i = 0;

            this.$http.get("/api/vocabulario/formasContagemPCA")
                .then(function (response) {
                    dataToParse = response.body;
                })
                .then(function () {
                    this.countTypes = this.parse(dataToParse, keys)
                        .map(function (a) {
                            return {
                                label: a.Label,
                                id: a.id,
                            }
                        });

                    this.countsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadSubCountTypes: function () {
            var dataToParse = [];
            var keys = ["id", "Label"];
            var i = 0;

            this.$http.get("/api/vocabulario/subFormasContagemPCA")
                .then(function (response) {
                    dataToParse = response.body;
                })
                .then(function () {
                    this.subcountTypes = this.parse(dataToParse, keys)
                        .map(function (a) {
                            return {
                                label: a.Label,
                                id: a.id,
                            }
                        });

                    this.subcountsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadIndexes: function () {
            var indexesToParse = [];
            var keys = ["id", "Termo"];

            this.$http.get("/api/termosIndice/filtrar/" + this.clas.ID)
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

            this.$http.get("/api/classes/" + this.clas.ID + "/descendencia")
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
            var entsToParse = [];
            var tipsToParse = [];
            var keys = ["id", "Sigla", "Designacao"];
            var i = 0;

            this.$http.get("/api/entidades")
                .then(function (response) {
                    entsToParse = response.body;
                })
                .then(function () {
                    
                    this.orgList = this.parse(entsToParse, keys)
                        .map(function (item) {
                            return {
                                data: [i++, item.Sigla, item.Designacao, "Entidade"],
                                selected: false,
                                id: item.id
                            }
                        });

                    this.$http.get("/api/tipologias")
                        .then(function (response) {
                            tipsToParse = response.body;
                        })
                        .then(function () {
                            this.orgList = this.orgList.concat(
                                this.parse(tipsToParse, keys)
                                    .map(function (item) {
                                        return {
                                            data: [i++, item.Sigla, item.Designacao, "Tipologia"],
                                            selected: false,
                                            id: item.id
                                        }
                                    })
                            ).sort(function (a, b) {
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
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadOwners: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla", "Designacao"];

            this.$http.get("/api/classes/" + this.clas.ID + "/donos")
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

                    let selectedLegs = this.clas.Legs.map(a => a.id);
                    this.legList = completeList
                        .map(function (item) {
                            return {
                                data: [i++, item.Tipo, item.Número, item.Titulo, item.Data],
                                selected: selectedLegs.indexOf(item.id) != -1,
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

            this.$http.get("/api/classes/" + this.clas.ID + "/legislacao")
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

            this.$http.get("/api/classes/" + this.clas.ID + "/notasAp")
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

            this.$http.get("/api/classes/" + this.clas.ID + "/notasEx")
                .then(function (response) {
                    notesToParse = response.body;
                })
                .then(function () {
                    this.clas.DelNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));
                    this.newClass.DelNotes = JSON.parse(JSON.stringify(this.parse(notesToParse, keys)));

                    this.clas.DelNotes = this.clas.DelNotes.map(
                        function(a){
                            a.Nota = a.Nota.replace(
                                /([0-9]{3}(\.?[0-9]+)*)/g,
                                '<a href="/classes/consultar/c$1">$1</a>'
                            )
                            return a;
                        }
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

            this.$http.get("/api/classes/" + this.clas.ID + "/exemplosNotasAp")
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

            this.$http.get("/api/classes")
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

            this.$http.get("/api/classes/" + this.clas.ID + "/relacionados")
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
            var keys = ['id', 'Designacao', 'Sigla'];

            this.$http.get("/api/classes/" + this.clas.ID + "/participantes")
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

            this.$http.get("/api/classes/" + this.clas.ID + "/pca")
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
                this.newClass.PCA.count = {
                    label: data.SubContagem.value,
                    id: data.SubContID.value.replace(/[^#]+#(.*)/, '$1')
                }
                PCA.subContagem = data.SubContagem.value;
            }

            if (data.ContagemNorm) {
                this.newClass.PCA.count = {
                    label: data.ContagemNorm.value,
                    id: data.ContNormID.value.replace(/[^#]+#(.*)/, '$1')
                }
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

                    let editCrit = {
                        legToSelect: [],
                        pnsToSelect: [],
                        edit: false,
                        remove: false,
                        original: true,
                        id: criterio.id.value.replace(/[^#]+#(.*)/, '$1'),
                        type: "",
                        content: newCrit.nota.replace(/<[^>]+>/g, ''),
                        pns: [],
                        leg: []
                    };

                    for (let type of this.PCA.critTypes) {
                        if (newCrit.tipo == type.label) {
                            editCrit.type = JSON.parse(JSON.stringify(type));
                            break;
                        }
                    }

                    editCrit.pns = newCrit.processos.map(
                        function (pn) {
                            return {
                                Code: pn.codigo,
                                Title: pn.titulo,
                                id: pn.id
                            }
                        }
                    );
                    editCrit.leg = newCrit.legislacao.map(
                        function (dip) {
                            return {
                                Type: dip.tipo,
                                Num: dip.numero,
                                id: dip.id
                            }
                        }
                    );
                    this.newClass.PCA.criteria.push(editCrit);
                }
            }

            return PCA;
        },
        loadDF: function () {
            var infoToParse = [];

            this.$http.get("/api/classes/" + this.clas.ID + "/df")
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
                this.newClass.DF.dest = DF.valores[0];

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

                    let editCrit = {
                        legToSelect: [],
                        pnsToSelect: [],
                        edit: false,
                        remove: false,
                        original: true,
                        id: criterio.id.value.replace(/[^#]+#(.*)/, '$1'),
                        type: "",
                        content: newCrit.nota.replace(/<[^>]+>/g, ''),
                        pns: [],
                        leg: []
                    };

                    for (let type of this.DF.critTypes) {
                        if (newCrit.tipo == type.label) {
                            editCrit.type = JSON.parse(JSON.stringify(type));
                            break;
                        }
                    }

                    editCrit.pns = newCrit.processos.map(
                        function (pn) {
                            return {
                                Code: pn.codigo,
                                Title: pn.titulo,
                                id: pn.id
                            }
                        }
                    );
                    editCrit.leg = newCrit.legislacao.map(
                        function (dip) {
                            return {
                                Type: dip.tipo,
                                Num: dip.numero,
                                id: dip.id
                            }
                        }
                    );
                    this.newClass.DF.criteria.push(editCrit);
                }
            }

            return DF;
        },
        filterParsePNS: function (selected, relID, relName) {
            let pns = [];
            let i = 0;
            if (this.edit.RelProcs) {
                pns = this.relationsSelected
                    .filter(
                        function (a) {
                            return a.relType == relID;
                        }
                    ).map(
                        function (a) {
                            return {
                                data: [i++, a.code, a.name],
                                id: a.id,
                                selected: selected.indexOf(a.id) != -1
                            }
                        }
                    );
            }
            else {
                pns = this.clas.RelProcs[relName]
                    .map(
                        function (a) {
                            return {
                                data: [i++, a.Code, a.Title],
                                id: a.id,
                                selected: selected.indexOf(a.id) != -1
                            }
                        }
                    );
            }
            return pns;
        },
        critTypeSelected: function (dest, payload) {
            this.critRelsReady = false;

            if (payload.rel >= 2) { //carregar processos
                let selected = dest.pns.map(a => a.id);
                let pns = [];

                if (payload.value == "CriterioJustificacaoComplementaridadeInfo") {
                    pns = this.filterParsePNS(selected, "eComplementarDe", "Complementar De");
                }
                else if (payload.value == "CriterioJustificacaoUtilidadeAdministrativa") {
                    pns = this.filterParsePNS(selected, "eSuplementoPara", "Suplemento Para");
                }
                else if (payload.value == "CriterioJustificacaoDensidadeInfo") {
                    pns = this.filterParsePNS(selected, "eSintetizadoPor", "Sintetizado Por");
                    pns = pns.concat(this.filterParsePNS(selected, "eSinteseDe", "Sintese De"))
                }

                dest.pnsToSelect = JSON.parse(JSON.stringify(pns));
            }
            else if (payload.rel == 1) {
                let selected = dest.leg.map(a => a.id);
                let leg = this.legList.map(
                    function (a) {
                        return {
                            data: a.data,
                            id: a.id,
                            selected: selected.indexOf(a.id) != -1
                        }
                    }
                );
                dest.legToSelect = JSON.parse(JSON.stringify(leg));
            }
            this.critRelsReady = true;
        },
        pnSelectedCrit: function (row, obj) {
            if (!row.selected) {
                obj.pns.push({
                    id: row.id,
                    Code: row.data[1],
                    Title: row.data[2]
                });
            }
            else {
                let i = 0;
                for (let p of obj.pns) {
                    if (row.id == p.id) { break; }
                    i++;
                }
                if (i < obj.pns.length) {
                    obj.pns.splice(i, 1);
                }
            }
        },
        legSelectedCrit: function (row, obj) {
            if (!row.selected) {
                obj.leg.push({
                    id: row.id,
                    Num: row.data[2],
                    Type: row.data[1]
                });
            }
            else {
                let i = 0;
                for (let doc of obj.leg) {
                    if (row.id == doc.id) { break; }
                    i++;
                }
                if (i < obj.leg.length) {
                    obj.leg.splice(i, 1);
                }
            }
        },
        addNewCrit: function (dest) {
            let i = 1;

            for (let crit of this.newClass[dest].criteria) {
                let n = crit.id.replace(/.+(\d+)$/, "$1");

                if (i != n) break;
                else i++;
            }
            let newID = "crit_just_" + dest.toLowerCase() + "_" + this.clas.ID + "_" + i;

            this.newClass[dest].criteria.push({
                legToSelect: [],
                pnsToSelect: [],
                edit: true,
                remove: false,
                original: false,
                id: newID,
                type: "",
                content: "",
                pns: [],
                leg: []
            });

            return this.newClass[dest].criteria.length-1;
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
            return prefix + "_" + this.clas.ID + "_" + newID;
        },
        readyToUpdate: function () {
            var keys = Object.keys(this.edit);

            for (var i = 0; i < keys.length; i++) {
                if (this.edit[keys[i]]) {
                    return true;
                }
            }
            console.log("ola");

            if (this.edit.Participants) {
                var keys = Object.keys(this.clas.Participants);

                for (var i = 0; i < keys.length; i++) {
                    if (this.newClass.Participants[keys[i]] != this.clas.Participants[keys[i]]) {
                        return true;
                    }
                }
            }

        },
        legSelected: function (row, list) {
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
                            this.participantLists.Executor.splice(orgIndex, 1);
                        }

                        let selectedIndex = findIndex(this.newClass.Participants.Executor, row.id);

                        if (selectedIndex != -1) {
                            this.newClass.Participants.Executor.splice(selectedIndex, 1);
                        }
                    }
                }
            }
        },
        pnRelSelected: function (payload) {
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
            if (!from) {
                return null;
            }
            else if (!minus) {
                return JSON.parse(JSON.stringify(from));
            }
            else {
                return from.filter(function (item) {
                    for (let i of minus) {
                        if (i.id == item.id) {
                            return false;
                        }
                    }
                    return true;
                });
            }
        },
        updateClass: function () {
            let okToGo = true;

            this.$refs.spinner.show();


            // Objeto a enviar no http.PUT
            var dataObj = {
                id: this.clas.ID,
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
                },
                PCA: {
                    value: null,
                    count: null,
                    subcount: null,
                    criteria: {
                        Change: [],
                        Add: [],
                        Delete: []
                    },
                },
                DF: {
                    dest: null,
                    criteria: {
                        Change: [],
                        Add: [],
                        Delete: []
                    },
                },
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

            if (this.edit.PCA.value && this.newClass.PCA.deadline) {
                dataObj.PCA.value = this.newClass.PCA.deadline;
            }
            if (this.edit.PCA.count) {
                dataObj.PCA.count = this.newClass.PCA.count.id;

                if (dataObj.PCA.count == "vc_pcaFormaContagem_disposicaoLegal") {
                    if (this.newClass.PCA.subcount.id) {
                        dataObj.PCA.subcount = this.newClass.PCA.subcount.id;
                    }
                    else {
                        messageL.showMsg("Um PCA com forma de contagem 'Conforme disposição legal' necessita de uma sub-forma de contagem")
                        okToGo = false;

                        return false;
                    }
                }
            }
            if (this.edit.PCA.just) {
                for (let crit of this.newClass.PCA.criteria) {
                    if (crit.edit) {
                        if (!crit.original) {
                            dataObj.PCA.criteria.Add.push({
                                id: crit.id,
                                type: crit.type.value,
                                note: crit.content,
                                pns: crit.pns,
                                leg: crit.leg,
                            })
                        }
                        else if (crit.remove) {
                            dataObj.PCA.criteria.Delete.push(crit.id)
                        }
                        else {
                            dataObj.PCA.criteria.Change.push({
                                id: crit.id,
                                type: crit.type.value,
                                note: crit.content,
                                pns: crit.pns,
                                leg: crit.leg,
                            })
                        }
                    }
                }
            }


            if (this.edit.DF.dest) {
                dataObj.DF.dest = this.newClass.DF.dest;
            }
            if (this.edit.DF.just) {
                for (let crit of this.newClass.DF.criteria) {
                    if (crit.edit) {
                        if (!crit.original) {
                            dataObj.DF.criteria.Add.push({
                                id: crit.id,
                                type: crit.type.value,
                                note: crit.content,
                                pns: crit.pns,
                                leg: crit.leg,
                            })
                        }
                        else if (crit.remove) {
                            dataObj.DF.criteria.Delete.push(crit.id)
                        }
                        else {
                            dataObj.DF.criteria.Change.push({
                                id: crit.id,
                                type: crit.type.value,
                                note: crit.content,
                                pns: crit.pns,
                                leg: crit.leg,
                            })
                        }
                    }
                }
            }

            console.log(JSON.stringify(dataObj, null, "\t"));
            if (okToGo) {    
                this.$http.put('/api/classes/'+this.clas.ID, dataObj,{
                    headers: {
                        'content-type' : 'application/json'
                    }
                })
                .then(function (response) {
                    this.classUpdated(this.clas.ID);
                    this.$refs.spinner.hide();
                    messageL.showMsg(response.body);
                    this.classShow=false;
                })
                .catch(function (error) {
                    console.error(error);
                });
            }
        },
        

        submeter: function(){
            this.$refs.spinner.show();

            var dataObj = {
                type: "Criação de TS",
                desc: "Nova tabela de seleção.",
                id: this.id,
                alt: this.editedClasses
            }

            this.$http.post('/api/pedidos', dataObj,{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then(function (response) {
                regex = new RegExp(/[0-9]+\-[0-9]+/, "gi");

                if(regex.test(response.body)){
                    window.location.href = '/users/pedido_submetido/'+response.body;
                }
                else {
                    messageL.showMsg(response.body);
                }

                this.$refs.spinner.hide();
            })
            .catch(function (error) {
                console.error(error);
            });

        },
        retroceder: function(){
            window.location.href= '/tabelasSelecao/submeter/escolher_processos';
        }
    },
    created: function(){
        this.id = window.location.pathname.split('/')[4];

        this.table.header=[
            "CLASSE",
            "TÍTULO"
        ];
        
        this.loadTS();
    }
})