var side = new Vue({
    el: '#sidenav',
    data: {
        navComplete: [
            {
                label: "Nível",
                anchor: "#nivel",
                lvl: 1
            },
            {
                label: "Classe Pai",
                anchor: "#pai",
                lvl: 2
            },
            {
                label: "Código",
                anchor: "#codigo",
                lvl: 1
            },
            {
                label: "Título",
                anchor: "#titulo",
                lvl: 1
            },
            {
                label: "Descrição",
                anchor: "#descricao",
                lvl: 1
            },
            {
                label: "Notas de Aplicação",
                anchor: "#notasA",
                lvl: 1
            },
            {
                label: "Exemplos de Notas de Aplicação",
                anchor: "#exemplos",
                lvl: 1
            },
            {
                label: "Notas de Exclusão",
                anchor: "#notasE",
                lvl: 1
            },
            {
                label: "Termos de Índice",
                anchor: "#termosI",
                lvl: 3
            },
            {
                label: "Tipo de Processo",
                anchor: "#tipoTrans",
                lvl: 3
            },
            {
                label: "Processo Tranversal",
                anchor: "#tipTrans",
                lvl: 3
            },
            {
                label: "Donos",
                anchor: "#donos",
                lvl: 3
            },
            {
                label: "Participantes",
                anchor: "#participantes",
                lvl: 3
            },
            {
                label: "Processos Relacionados",
                anchor: "#PNrel",
                lvl: 3
            },
            {
                label: "Legislação",
                anchor: "#legislacao",
                lvl: 3
            },
            {
                label: "PCA",
                anchor: "#PCA",
                lvl: 3
            },
            {
                label: "Destino Final",
                anchor: "#DF",
                lvl: 3
            },
        ],
        nav: []
    },
    methods: {
        changeNav: function (type) {
            this.nav = this.navComplete.filter(
                a => a.lvl <= type
            )
        }
    },
    mounted() {
        this.changeNav(1);
    }
})

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
        nEdits: 0,
        type: 1,

        parent: null,
        parents: null,
        parentsReady: false,

        code: null,

        title: null,

        orgsTableHeader: ["#", "Sigla", "Nome", "Tipo"],
        orgsTableWidth: ["4%", "15%", "70%", "15%"],
        ownerList: [],
        selectedOwners: [],
        orgsReady: false,

        legsTableHeader: ["#", "Tipo", "Número", "Título", "Data"],
        legsTableWidth: ['5%', '19%', '11%', '50%', '15%'],
        legList: [],
        selectedLegs: [],
        legsReady: false,

        description: null,

        newExAppNote: null,
        exAppNotes: [],

        newAppNote: null,
        appNotes: [],

        newDelNote: null,
        delNotes: [],

        newIndex: null,
        indexes: [],

        status: "H",

        procType: "pc",

        procTrans: "N",

        partDic: {
            Apreciador: "Apreciar",
            Assessor: "Assessorar",
            Comunicador: "Comunicar",
            Decisor: "Decidir",
            Executor: "Executar",
            Iniciador: "Iniciar",
        },

        participantLists: {
            Apreciador: [],
            Assessor: [],
            Comunicador: [],
            Decisor: [],
            Iniciador: [],
            Executor: [],
        },
        participantsSelected: {
            Apreciador: [],
            Assessor: [],
            Comunicador: [],
            Decisor: [],
            Executor: [],
            Iniciador: [],
        },
        participantsSelectedInfo: {
            Apreciador: [],
            Assessor: [],
            Comunicador: [],
            Decisor: [],
            Executor: [],
            Iniciador: [],
        },

        classesTableHeader: ["CLASSE", "TÍTULO"],
        cwidth: ['16%', '81%'],
        relationList: [],
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
        relationsSelectedInfo: [],
        classesReady: false,

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
        codeMessage: "",
        parentvalue: "",

        modalMsgShow: false,
        modalMsg: "",
    },
    watch: {
        parentvalue: function () {
            this.parent = this.parentvalue.value;
        },
        parent: function () {
            this.code = this.parent.slice(1, this.parent.length) + ".";
        },
        type: function () {
            this.parent = "";
            if (this.type > 1) {
                this.loadParents();
            }
            if (this.type >= 3 && !this.classesReady) {
                this.loadClasses();
            }
            side.changeNav(this.type);
        },
        code: function () {
            this.codeMessage = "";

            if (this.type > 1) {
                if (this.code.indexOf(this.parent.slice(1, this.parent.length)) != 0) {
                    this.code = this.parent.slice(1, this.parent.length) + ".";
                }
                if (this.code[this.parent.length - 1] != '.') {
                    this.code = this.parent.slice(1, this.parent.length) + ".";
                }
            }
            let reg = {
                1: /^[0-9]{3}$/,
                2: /^[0-9]{3}\.[0-9]{2}$/,
                3: /^[0-9]{3}\.[0-9]{2}\.[0-9]{3}$/,
                4: /^[0-9]{3}\.[0-9]{2}\.[0-9]{3}\.[0-9]{3}$/,
            }

            if (!reg[this.type].test(this.code)) {
                this.codeMessage = "Formato inválido";
            }
            else {
                this.checkCodeAvailability(this.code);
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
        checkCodeAvailability: _.debounce(
            function (code) {
                var count;

                this.$http.get(`/api/classes/${code}/check/${this.type}`)
                    .then(function (response) {
                        count = response.body;
                    })
                    .then(function () {
                        if (parseInt(count) > 0) {
                            this.codeMessage = "Codigo já existe!";
                        }
                    })
            },500
        ),
        showMsg(text) {
            this.modalMsg = text;
            this.modalMsgShow = true;
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
        critTypeSelected(crit, obj, payload) {
            crit.RelsReady=false;

            if(payload && payload.rel>=2){
                crit.pnsToSelect = JSON.parse(JSON.stringify(this[obj].criteria.pns[payload.value]));
            }

            crit.RelsReady=true;
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

            this.$http.get("/api/classes/filtrar")
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {
                    var classList = [];
                    classList = this.parseClasses(content);

                    this.relationLists = JSON.parse(
                        JSON.stringify(classList)
                    );

                    this.pca.criteria.classes = JSON.parse(
                        JSON.stringify(classList)
                    );

                    this.df.criteria.classes = JSON.parse(
                        JSON.stringify(classList)
                    );

                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseClasses: function (dataToParse) {
            var destination = [];
            const indexes = {};
            let avo;
            let pai;

            for (let pn of dataToParse) {
                let codeAvo = pn.AvoCodigo.value;
                let indexesAvo = indexes[codeAvo];
                let codePai = pn.PaiCodigo.value;

                let pnSelected = false;


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
        selectClicked(payload) {
            var row = payload.rowData;

            if (!row.selected) {
                let newPN = {
                    name: row.content[1],
                    code: row.content[0],
                    id: row.codeID,
                    relType: null
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

                    this.ownerList = this.parse(orgsToParse, keys)
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
                                JSON.stringify(this.ownerList)
                            );
                        }
                    }

                    this.orgsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        orgSelected: function (row, list, partType) {
            var findIndex = function (list, id) {
                for (let [index, item] of list.entries()) {
                    if (id == item.id) {
                        return index;
                    }
                }
                return -1;
            }

            if (!row.selected) {
                list.push(row.id);

                if (partType && partType != 'dono') {
                    this.participantsSelectedInfo[partType].push(row.data);
                }
                if (partType && partType == 'dono') {
                    this.participantLists.Executor.push(JSON.parse(JSON.stringify(row)));
                }
            }
            else {
                let index = list.indexOf(row.id);
                if (index != -1) {
                    list.splice(index, 1);

                    if (partType && partType != 'dono') {
                        this.participantsSelectedInfo[partType].splice(index, 1);
                    }
                    else if (partType && partType == 'dono') {
                        let exIndex = this.participantsSelected.Executor.indexOf(row.id);
                        if (exIndex != -1) {
                            this.participantsSelected.Executor.splice(exIndex, 1);
                            this.participantsSelectedInfo.Executor.splice(exIndex, 1);
                        }

                        let listIndex = findIndex(this.participantLists.Executor, row.id);
                        if (listIndex != -1) {
                            this.participantLists.Executor.splice(listIndex, 1);
                        }
                    }
                }
            }
        },
        loadLegs: function () {
            var legsToParse = [];
            var keys = ["id", "Número", "Titulo", "Tipo", "Data"];
            var i = 0;

            this.$http.get("/api/legislacao")
                .then(function (response) {
                    legsToParse = response.body;
                })
                .then(function () {
                    this.legList = this.parse(legsToParse, keys)
                        .map(function (item) {
                            return {
                                data: [i++, item.Tipo, item.Número, item.Titulo, item.Data],
                                selected: false,
                                id: item.id
                            }
                        });
                    this.pca.criteria.legislation = JSON.parse(
                        JSON.stringify(this.legList)
                    );
                    this.df.criteria.legislation = JSON.parse(
                        JSON.stringify(this.legList)
                    );

                    this.legsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParents: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/classes/nivel=" + (this.type - 1))
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.parents = this.parse(classesToParse, keys)
                        .map(function (item) {
                            return {
                                label: item.Code + " - " + item.Title,
                                value: item.id,
                            }
                        }).sort(function (a, b) {
                            return a.label.localeCompare(b.label);
                        });
                    this.parentsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
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
                this.message = "Formato do código errado!";
                return false;
            }

            if (this.codeMessage.length > 0) {
                this.message = "Formato do código errado!";
                return false;
            }

            if (this.relationsSelected.length) {
                for (let pn of this.relationsSelected) {
                    if (!pn.relType) {
                        this.message = "É necessário selecionar o tipo de relação com todos os processos relacionados selecionados!";
                        return false;
                    }
                }
            }

            if (this.type == 1) {
                if (this.code && this.title) {
                    dataObj = {
                        Level: this.type,               //
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
                    this.message = "Preencher campos obrigatórios!";
                    return false;
                }
            }
            else {
                if (this.parent && this.code && this.title) {
                    if (this.type >= 3) {
                        if (this.procTrans == 'S') {
                            let check = 0;

                            for (const key in this.participantsSelected) {
                                check += this.participantsSelected[key].length;
                            }

                            if (check == 0) {
                                this.message = "Um processo transversal tem de ter pelo menos um participante!";
                                return false;
                            }
                            else {
                                dataObj = {
                                    Level: this.type,               //
                                    Parent: this.parent,            //
                                    Code: this.code,                //
                                    Title: this.title,              //
                                    Description: this.description,  //
                                    AppNotes: this.appNotes,        //
                                    ExAppNotes: this.exAppNotes,    //
                                    DelNotes: this.delNotes,        //
                                    Indexes: this.indexes,          //
                                    Type: this.procType,            //
                                    Trans: this.procTrans,          //
                                    Owners: this.selectedOwners,         //
                                    Participants: this.participantsSelected,//
                                    RelProcs: this.relationsSelected,        //
                                    Status: this.status,            //
                                    Legislations: this.selectedLegs,  //
                                    PCA: {
                                        dueDate: this.pca.dueDate,
                                        count: this.pca.count,
                                        subcount: this.pca.subcount,
                                        criteria: this.pca.criteria.list.map(
                                            function(crit){
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
                                            function(crit){
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
                                Level: this.type,               //
                                Parent: this.parent,            //
                                Code: this.code,                //
                                Title: this.title,              //
                                Description: this.description,  //
                                AppNotes: this.appNotes,        //
                                ExAppNotes: this.exAppNotes,    //
                                DelNotes: this.delNotes,        //
                                Indexes: this.indexes,          //
                                Type: this.procType,            //
                                Trans: this.procTrans,          //
                                Owners: this.selectedOwners,         //
                                Participants: null,             //
                                RelProcs: this.relationsSelected,        //
                                Status: this.status,            //
                                Legislations: this.selectedLegs,  //
                                PCA: {
                                    dueDate: this.pca.dueDate,
                                    count: this.pca.count,
                                    subcount: this.pca.subcount,
                                    criteria: this.pca.criteria.list.map(
                                        function(crit){
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
                                        function(crit){
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
                            Level: this.type,               //
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
                    this.message = "Preencher campos obrigatórios!";
                    return false;
                }
            }
        },
        add: function () {
            this.$refs.spinner.show();

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
                        this.message = response.body;
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
            }
        }
    },
    created: function () {
        this.loadOrgs();
        this.loadLegs();
        this.loadClasses();
        this.loadCountTypes();
        this.loadSubCountTypes();
    }
})