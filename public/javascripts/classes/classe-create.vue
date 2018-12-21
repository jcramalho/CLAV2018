var newClass = new Vue({
    el: '#nova-classe-form',
    http: {
        emulateJSON: true,
        emulateHTTP: true
    },
    components: {
        spinner: VueStrap.spinner,
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
        tabs: VueStrap.tabs,
        tabGroup: VueStrap.tabGroup,
        tab: VueStrap.tab,
        modal: VueStrap.modal,
    },
    data: {
        codeFormats: {
                1: /^[0-9]{3}$/,
                2: /^[0-9]{3}\.[0-9]{2}$/,
                3: /^[0-9]{3}\.[0-9]{2}\.[0-9]{3}$/,
                4: /^[0-9]{3}\.[0-9]{2}\.[0-9]{3}\.[0-9]{3}$/,
        },

    // Objeto que guarda uma classe

        classe: {
            // Metainformação e campos da área de Descrição

            nivel: 1,
            pai: null,
            codigo: null,
            titulo: null,
            descricao: null,
            notasAp: [],
            exemplosNotasAp: [],
            notasEx: [],
            termosInd: [],

            // Campos da área do Contexto de Avaliação
            // Tipo de processo

            tipoProc: "PC",
            procTrans: "N",

            // Donos do processo: lista de entidades

            donos: [],

            // Participantes no processo: lista de entidades

            participantes: {
                Apreciador: [],
                Assessor: [],
                Comunicador: [],
                Decisor: [],
                Iniciador: [],
                Executor: [],
            },

            // Processos Relacionados

            processosRelacionados: [],
        },

        // Estruturas auxiliares

        classesPai: [],
        entidadesD: [],
        entidadesP: [],

        semaforos: {
            paisReady: false,
            classesReady: false,
            entidadesReady: false,
        },

        estilo: {
            entidadesTableHeader: ["Sigla", "Designacao", "Tipo"],
            entidadesTableWidth: ["15%", "70%", "15%"],
            participantesTableHeader: ["Sigla", "Designacao", "Tipo", "Intervenção"],
            participantesTableWidth: ["15%", "55%", "15%", "15%"],
            processosRelacionadosTableHeader: ['CLASSE', 'TÍTULO'],
            processosRelacionadosTableWidth: ['16%', '81%'],
        },

    // Mensagens de validação

        mensValCodigo: "",

        classesPai: null,

        legsReady: false,
        
        legsTableHeader: ["#", "Tipo", "Número", "Título", "Data"],
        legsTableWidth: ['5%', '19%', '11%', '50%', '15%'],
        legList: [],
        selectedLegs: [],
        
        relationsSelected: [],
        relationsSelectedInfo: [],

        status: "H",

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
        
        

        pca: {
            dueDate: null,
            count: { label: "Forma de Contagem", id: null },
            subcount: { label: "Sub-forma de Contagem", id: null },
            criteria: {
                new: {
                    type: { label: "Tipo de Critério", rel: 0 },
                    content: null,
                    pns: [],
                    leg: [],
                },
                classes: [],
                legislation: [],
                pns: {
                    CriterioJustificacaoUtilidadeAdministrativa: [],
                    CriterioJustificacaoComplementaridadeInfo: [],
                },
                types: [
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
                list: []
            }
        },
        countTypes: null,
        subcountTypes: null,
        countsReady: false,
        subcountsReady: false,
        pnsTableHeader: ["#", "Código", "Título"],
        pnsTableWidth: ["4%", "16%", "81%"],

        df: {
            end: null,
            criteria: {
                new: {
                    type: { label: "Tipo de Critério", rel: 0 },
                    content: null,
                    pns: [],
                    leg: [],
                },
                classes: [],
                legislation: [],
                pns: {
                    CriterioJustificacaoDensidadeInfo: [],
                    CriterioJustificacaoComplementaridadeInfo: [],
                },
                types: [
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
                list: []
            }
        },

        message: null,

        modalMsgShow: false,
        modalMsg: "",
    },
    watch: {
        'classe.pai': function () {
            if(this.classe.pai)
                this.classe.codigo = this.classe.pai.value.slice(1, this.classe.pai.value.length) + ".";
        },
        'classe.nivel': function () {
            this.classe.pai = "";
            if (this.classe.nivel > 1) {
                this.loadParents();
            }
            if (this.classe.nivel >= 3 && !this.classesReady) {
                this.loadClasses();
            }
            sideNav.changeNav(this.classe.nivel);
        },
        'classe.codigo': function () {
            this.mensValCodigo = "";

            if (this.classe.nivel > 1) {
                if (this.classe.codigo.indexOf(this.classe.pai.value.slice(1, this.classe.pai.value.length)) != 0) {
                    this.classe.codigo = this.classe.pai.value.slice(1, this.classe.pai.value.length) + ".";
                }
                if (this.classe.codigo[this.classe.pai.value.length - 1] != '.') {
                    this.classe.codigo = this.classe.pai.value.slice(1, this.classe.pai.value.length) + ".";
                }
            }

            if (!this.codeFormats[this.classe.nivel].test(this.classe.codigo)) {
                this.mensValCodigo = "Formato inválido";
            }
            else {
                this.verificaExistenciaCodigo(this.classe.codigo);
            }
        },
        relationsSelected: {
            deep: true,
            handler: function () {
                let pnsCI = []; //complementaridade info - "eComplementarDe"
                let pnsUA = []; //utilidade administrativa - "eSuplementoPara"
                let pnsDI = []; //Densidade informacional - "eSinteseDe" + "eSintetizadoPor"
                let i;

                //complementaridade info
                pnsCI = this.relationsSelected.filter(
                    function (a) {
                        return a.relType == "eComplementarDe";
                    }
                );

                i = 0;
                this.pca.criteria.pns.CriterioJustificacaoComplementaridadeInfo = pnsCI.map(
                    function (a) {
                        return {
                            data: [i++, a.code, a.name],
                            id: a.id,
                            selected: false
                        }
                    }
                );
                this.df.criteria.pns.CriterioJustificacaoComplementaridadeInfo = JSON.parse(JSON.stringify(this.pca.criteria.pns.CriterioJustificacaoComplementaridadeInfo));

                //utilidade administrativa
                pnsUA = this.relationsSelected.filter(
                    function (a) {
                        return a.relType == "eSuplementoPara";
                    }
                );

                i = 0;
                this.pca.criteria.pns.CriterioJustificacaoUtilidadeAdministrativa = pnsUA.map(
                    function (a) {
                        return {
                            data: [i++, a.code, a.name],
                            id: a.id,
                            selected: false
                        }
                    }
                );

                //Densidade informacional
                pnsDI = this.relationsSelected.filter(
                    function (a) {
                        return a.relType == "eSinteseDe" || a.relType == "eSintetizadoPor";
                    }
                );

                i = 0;
                this.df.criteria.pns.CriterioJustificacaoDensidadeInfo = pnsDI.map(
                    function (a) {
                        return {
                            data: [i++, a.code, a.name],
                            id: a.id,
                            selected: false
                        }
                    }
                );
            }
        }
    },
    methods: {
        verificaExistenciaCodigo: _.debounce(
            function (codigo) {
                this.$http.get('/api/classes/verificar/' + codigo)
                    .then(response => {
                        if (response.body) {
                            this.mensValCodigo = "Este código já existe!";
                        }
                    })
            }, 500
        ),
        relChanged: function (index, rel) {
            if (rel.relType == "eSuplementoPara") {
                if (this.autoCritIndexes.utilidadeAdmin == -1) {
                    let critIndex = -1;

                    //verificar se já existe um critério de utilidade administrativa
                    for (let [i, crit] of this.pca.criteria.list.entries()) {
                        if (crit.type.value == "CriterioJustificacaoUtilidadeAdministrativa") {
                            critIndex = i;

                            break;
                        }
                    }

                    //se não existir criar
                    if (critIndex == -1) {
                        critIndex = this.pca.criteria.list.length;

                        this.addNewJustCrit(this.pca.criteria.list);

                        this.pca.criteria.list[critIndex].type = {
                            value: "CriterioJustificacaoUtilidadeAdministrativa",
                            label: "Critério Utilidade Administrativa",
                            rel: 2
                        };
                    }
                    this.autoCritIndexes.utilidadeAdmin = critIndex;
                }
            }
            else if (rel.relType == "eSinteseDe" || rel.relType == "eSintetizadoPor") {
                if ((rel.relType == "eSinteseDe" && this.checkIfExistsRelation("eSintetizadoPor")) || (rel.relType == "eSintetizadoPor" && this.checkIfExistsRelation("eSinteseDe"))) {
                    this.showMsg("Não podem existir ao mesmo tempo as relações 'Síntese De' e 'Sintetizado Por'!");
                }
                else if (rel.relType == "eSintetizadoPor" && this.checkIfExistsRelation("eComplementarDe")) {
                    this.showMsg("Não podem existir ao mesmo tempo as relações 'Sintetizado Por' e 'Complementar De'!");
                }
                else {
                    this.df.end = (rel.relType == "eSinteseDe") ? "C" : "E";

                    if (this.autoCritIndexes.densidadeInfo == -1) {
                        let critIndex = -1;

                        //verificar se já existe um critério de utilidade administrativa
                        for (let [i, crit] of this.df.criteria.list.entries()) {
                            if (crit.type.value == "CriterioJustificacaoDensidadeInfo") {
                                critIndex = i;

                                break;
                            }
                        }

                        //se não existir criar
                        if (critIndex == -1) {
                            critIndex = this.df.criteria.list.length;

                            this.addNewJustCrit(this.df.criteria.list);

                            this.df.criteria.list[critIndex].type = {
                                value: "CriterioJustificacaoDensidadeInfo",
                                label: "Densidade Informacional",
                                rel: 2
                            };
                        }
                        this.autoCritIndexes.densidadeInfo = critIndex;
                    }
                }
            }
            else if (rel.relType == "eComplementarDe") {
                if (this.checkIfExistsRelation("eSintetizadoPor")) {
                    this.showMsg("Não podem existir ao mesmo tempo as relações 'Sintetizado Por' e 'Complementar De'!");
                }
                else {
                    this.df.end = "C";

                    if (this.autoCritIndexes.complementaridadeInfo == -1) {
                        let critIndex = -1;

                        //verificar se já existe um critério de utilidade administrativa
                        for (let [i, crit] of this.df.criteria.list.entries()) {
                            if (crit.type.value == "CriterioJustificacaoComplementaridadeInfo") {
                                critIndex = i;

                                break;
                            }
                        }

                        //se não existir criar
                        if (critIndex == -1) {
                            critIndex = this.df.criteria.list.length;

                            this.addNewJustCrit(this.df.criteria.list);

                            this.df.criteria.list[critIndex].type = {
                                value: "CriterioJustificacaoComplementaridadeInfo",
                                label: "Critério Complementaridade Informacional",
                                rel: 2
                            };
                        }
                        this.autoCritIndexes.complementaridadeInfo = critIndex;
                    }
                }
            }
        },
        checkIfExistsRelation: function (rela, from) {
            if (from) {
                for (let rel of this.relationsSelected.slice(from)) {
                    if (rel.relType == rela) {
                        return true;
                    }
                }
            }
            else {
                for (let rel of this.relationsSelected) {
                    if (rel.relType == rela) {
                        return true;
                    }
                }
            }
            return false;
        },
        showMsg(text) {
            this.modalMsg = text;
            this.modalMsgShow = true;
        },
        loadCountTypes: function () {
            this.$http.get("/api/vocabulario/formasContagemPCA")
                .then(function (response) {
                    this.countTypes = response.body;
                    this.countsReady = true;
                })
                .catch(function (error) { console.error(error);});
        },
        loadSubCountTypes: function () {
            this.$http.get("/api/vocabulario/subFormasContagemPCA")
                .then(function (response) {
                    this.subcountTypes = response.body;
                    this.subcountsReady = true;
                })
                .catch(function (error) { console.error(error); });
        },
        cleanSelection: function (path) {
            for (var line of path) {
                line.selected = false;
                line.drop = false;

                if (line.sublevel) {
                    this.cleanSelection(line.sublevel);
                }
            }
        },
        legSelectedCrit: function (row, obj) {
            if (!row.selected) { // se a legislação foi selecionada acrescenta-se à lista
                obj.leg.push({
                    id: row.id,
                    numero: row.data[2],
                    tipo: row.data[1]
                });
            }
            else {  // se foi desslecionada retira-se da lista
                let i = 0;
                let found = false;
                while(i < obj.leg.length && !found){
                    if (row.id == obj.leg[i].id) found = true;
                    i++;
                }
                if (i < obj.leg.length) {
                    obj.leg.splice(i, 1);
                }
            }
        },
        pnSelectedCrit: function (row, obj) {
            alert(JSON.stringify(row))
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
        critTypeSelected(crit, obj, payload) {
            crit.RelsReady = false;

            if (payload && payload.rel >= 2) {
                crit.pnsToSelect = JSON.parse(JSON.stringify(this[obj].criteria.pns[payload.value]));
            }

            crit.RelsReady = true;
        },
        addNewJustCrit: function (obj) {
            obj.push({
                RelsReady: false,
                type: { label: "Tipo de Critério", rel: 0 },
                content: null,
                pns: [],
                leg: [],
                legToSelect: JSON.parse(JSON.stringify(this.pca.criteria.legislation)),
                pnsToSelect: []
            });
        },
        loadClasses: function () {
            this.ready = false;
            let content = [];

            this.$http.get("/api/classes")
                .then(function (response) {
                    this.relationLists = response.body;
                    this.pca.criteria.classes = response.body;
                    this.df.criteria.classes = response.body;
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        selectClicked(payload) {
            alert(JSON.stringify(payload))
            var row = payload.rowData;

            if (!row.selected) {
                let newPN = {
                    selected: true,
                    titulo: row.titulo,
                    codigo: row.codigo,
                    id: 'c' + row.codigo,
                    relType: null
                };

                this.relationsSelected.push(newPN);

                this.relationsSelected.sort(
                    function (a, b) {
                        return a.codigo.localeCompare(b.code);
                    }
                );
            }

            else {
                let index = 0;
                let found = false;

                while(index < this.relationsSelected.length && !found){
                    if (this.relationsSelected[index].codigo == row.codigo) found=true;
                    index++;
                }
                    
                if (index < this.relationsSelected.length) {
                    this.relationsSelected.splice(index, 1);
                }
            }
        },
        loadEntidades: function () {
            this.$http.get("/api/entidades")
                .then(response => {
                    this.entidadesD = response.body
                        .map(function (item) {
                            return {
                                data: [item.sigla, item.designacao, "Entidade", "Por selecionar"],
                                selected: false,
                                id: item.id
                            }
                        });
                    this.$http.get("/api/tipologias")
                        .then(response => {
                            this.entidadesD = this.entidadesD.concat(
                                response.body
                                    .map(function (item) {
                                        return {
                                            data: [item.sigla, item.designacao, "Tipologia", "Por Selecionar"],
                                            selected: false,
                                            id: item.id
                                        }
                                    })
                            ).sort(function (a, b) {
                                return a.data[1].localeCompare(b.data[1]);
                            });

                            this.entidadesP = JSON.parse(JSON.stringify(this.entidadesD));
                            this.semaforos.entidadesReady = true;
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        selecionarDono: function (row) {
            if (!row.selected) {
                this.classe.donos.push(row.id);
            }
            else {
                let index = this.classe.donos.indexOf(row.id);
                if (index != -1) {
                    this.classe.donos.splice(index, 1);
                }
            }
        },
        selecionarParticipante: function (row) {
            if (!row.selected) {
                this.classe.participantes[row.data[3]].push(row.id);
            }
            else {
                let index = this.classe.participantes[row.data[3]].indexOf(row.id);
                if (index != -1) {
                    this.classe.participantes[row.data[3]].splice(index, 1);
                }
            } 
        },
        loadLegs: function () {
            var i = 0;

            this.$http.get("/api/legislacao")
                .then(response => {
                    this.legList = response.body
                        .map(function (item) {
                            return {
                                data: [i++, item.tipo, item.numero, item.sumario, item.data],
                                selected: false,
                                id: item.id
                            }
                        });
                    this.pca.criteria.legislation = this.legList
                    this.df.criteria.legislation = this.legList
                    this.legsReady = true
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParents: function () {
            this.$http.get("/api/classes/nivel/" + (this.classe.nivel - 1))
                .then(function (response) {
                    this.classesPai = response.body.map(function (item) {
                        return {
                            label: item.codigo + " - " + item.titulo,
                            value: item.id.split('#')[1],
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                    this.paisReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        addNewIndex: function () {
            if (this.newIndex) {
                this.indexes.push({
                    id: "",
                    Note: this.newIndex
                });
                this.newIndex = '';
            }
        },
        checkready: function (dataObj) {
            if (!this.code.match(/^([0-9]+\.)*[0-9]+$/)) {
                messageL.showMsg("Formato do código errado!");
                return false;
            }

            if (this.mensValCodigo.length > 0) {
                messageL.showMsg("Formato do código errado!");
                return false;
            }

            //verificar relações
            if (this.relationsSelected.length) {
                for ([i, pn] of this.relationsSelected.entries()) {
                    if (!pn.relType) {
                        messageL.showMsg("É necessário selecionar o tipo de relação com todos os processos relacionados selecionados!");
                        return false;
                    }
                    else if (pn.relType == "eSintetizadoPor") {
                        if (this.checkIfExistsRelation("eSinteseDe", i)) {
                            messageL.showMsg("Não podem existir ao mesmo tempo as relações 'Síntese De' e 'Sintetizado Por'!");
                            return false;
                        }
                        if (this.checkIfExistsRelation("eComplementarDe", i)) {
                            messageL.showMsg("Não podem existir ao mesmo tempo as relações 'Complementar De' e 'Sintetizado Por'!");
                            return false;
                        }
                    }
                }
            }

            if (this.classe.nivel == 1) {
                //verificar campos obrigatórios
                if (this.code && this.title) {
                    dataObj = {
                        Level: this.classe.nivel,               //
                        Parent: null,                   //
                        Code: this.code,                //
                        Title: this.title,              //
                        Description: this.description,  //
                        AppNotes: this.appNotes,        //
                        ExAppNotes: this.exAppNotes,    //
                        DelNotes: this.delNotes,        //
                        Type: null,                     //
                        Trans: null,                    //
                        Owners: null,                   //
                        Participants: null,             //
                        RelProcs: null,                 //
                        Status: this.status,            //
                        Legislations: null,             //
                        Indexes: null,
                        PCA: null,
                        DF: null,
                    };

                    return dataObj;
                }
                else {
                    messageL.showMsg("Preencher campos obrigatórios!");
                    return false;
                }
            }
            else {
                if (this.parent && this.code && this.title) {
                    if (this.classe.nivel >= 3) {
                        if (this.classe.procTrans == 'S') {
                            let check = 0;

                            for (const key in this.participantsSelected) {
                                check += this.participantsSelected[key].length;
                            }

                            if (check == 0) {
                                messageL.showMsg("Um processo transversal tem de ter pelo menos um participante!");
                                return false;
                            }
                            else {
                                dataObj = {
                                    Level: this.classe.nivel,                       //
                                    Parent: this.parent,                    //
                                    Code: this.code,                        //
                                    Title: this.title,                      //
                                    Description: this.description,          //
                                    AppNotes: this.appNotes,                //
                                    ExAppNotes: this.exAppNotes,            //
                                    DelNotes: this.delNotes,                //
                                    Indexes: this.indexes,                  //
                                    Type: this.procType,                    //
                                    Trans: this.classe.procTrans,                  //
                                    Owners: this.selectedOwners,            //
                                    Participants: this.participantsSelected,//
                                    RelProcs: this.relationsSelected,       //
                                    Status: this.status,                    //
                                    Legislations: this.selectedLegs,        //
                                    PCA: {
                                        dueDate: this.pca.dueDate,
                                        count: this.pca.count,
                                        subcount: this.pca.subcount,
                                        criteria: this.pca.criteria.list.map(
                                            function (crit) {
                                                return {
                                                    type: crit.type,
                                                    leg: crit.leg,
                                                    pns: crit.pns,
                                                    content: crit.content
                                                }
                                            }
                                        )
                                    },
                                    DF: {
                                        end: this.df.end,
                                        criteria: this.df.criteria.list.map(
                                            function (crit) {
                                                return {
                                                    type: crit.type,
                                                    leg: crit.leg,
                                                    pns: crit.pns,
                                                    content: crit.content
                                                }
                                            }
                                        )
                                    },
                                };

                                return dataObj;
                            }
                        }
                        else {
                            dataObj = {
                                Level: this.classe.nivel,                   //
                                Parent: this.parent,                //
                                Code: this.code,                    //
                                Title: this.title,                  //
                                Description: this.description,      //
                                AppNotes: this.appNotes,            //
                                ExAppNotes: this.exAppNotes,        //
                                DelNotes: this.delNotes,            //
                                Indexes: this.indexes,              //
                                Type: this.procType,                //
                                Trans: this.classe.procTrans,              //
                                Owners: this.selectedOwners,        //
                                Participants: null,                 //
                                RelProcs: this.relationsSelected,   //
                                Status: this.status,                //
                                Legislations: this.selectedLegs,    //
                                PCA: {
                                    dueDate: this.pca.dueDate,
                                    count: this.pca.count,
                                    subcount: this.pca.subcount,
                                    criteria: this.pca.criteria.list.map(
                                        function (crit) {
                                            return {
                                                type: crit.type,
                                                leg: crit.leg,
                                                pns: crit.pns,
                                                content: crit.content
                                            }
                                        }
                                    )
                                },
                                DF: {
                                    end: this.df.end,
                                    criteria: this.df.criteria.list.map(
                                        function (crit) {
                                            return {
                                                type: crit.type,
                                                leg: crit.leg,
                                                pns: crit.pns,
                                                content: crit.content
                                            }
                                        }
                                    )
                                },
                            };

                            return dataObj;
                        }
                    }
                    else {
                        dataObj = {
                            Level: this.classe.nivel,               //
                            Parent: this.parent,            //
                            Code: this.code,                //
                            Title: this.title,              //
                            Description: this.description,  //
                            AppNotes: this.appNotes,        //
                            ExAppNotes: this.exAppNotes,    //
                            DelNotes: this.delNotes,        //
                            Indexes: null,                  //
                            Type: null,                     //
                            Trans: null,                    //
                            Owners: null,                   //
                            Participants: null,             //
                            RelProcs: null,                 //
                            Status: this.status,            //
                            Legislations: null,             //
                            PCA: null,
                            DF: null,
                        };

                        return dataObj;
                    }
                }
                else {
                    messageL.showMsg("Preencher campos obrigatórios!");
                    return false;
                }
            }
        },
        add: function () {

            alert(JSON.stringify(this.classe))

            /* this.$refs.spinner.show();

            for ([i, note] of this.appNotes.entries()) {
                note.id = "na_c" + this.code + "_" + (i + 1);
            }

            for ([i, note] of this.delNotes.entries()) {
                note.id = "ne_c" + this.code + "_" + (i + 1);
            }

            var dataObj = {
                Level: null,        //
                Parent: null,       //
                Code: null,         //
                Title: null,        //
                Description: null,  //
                AppNotes: null,     //
                ExAppNotes: null,   //
                DelNotes: null,     //
                Type: null,         //
                Trans: null,        //
                Owners: null,       //
                Participants: null, //
                RelProcs: null,     //
                Status: null,       //
                Legislations: null, //
                Indexes: null,
                PCA: null,
                DF: null
            };

            if (dataObj = this.checkready(dataObj)) {

                this.$http.post('/api/classes', dataObj, {
                    headers: {
                        'content-type': 'application/json'
                    }
                }).then(function (response) {
                    regex = new RegExp(/[0-9]+\-[0-9]+/, "gi");

                    if (regex.test(response.body)) {
                        window.location.href = '/users/pedido_submetido/' + response.body;
                    }
                    else {
                        messageL.showMsg(response.body);
                    }

                    this.$refs.spinner.hide();
                }).catch(function (error) {
                    console.error(error);
                    this.message = "Ocorreu um erro!"
                    this.$refs.spinner.hide();
                });

                //console.log(dataObj);
            }
            else {
                this.$refs.spinner.hide();
            } */
        }
    },
    created: function () {
        this.loadEntidades();
        this.loadLegs();
        this.loadClasses();
        this.loadCountTypes();
        this.loadSubCountTypes();
    }
})