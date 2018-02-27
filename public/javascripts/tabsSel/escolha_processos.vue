var escolha = new Vue({
    el: '#tabs',
    data: {
        entidade: {
            nome: "Teste",
        },
        newTipol: null,
        tipolList: [],
        myTipolList: [],
        tableHeader: [],
        commonProcs: [],
        specificProcs: [],
        restProcs: [],
        ready: false,
        specReady: false,
        restReady: false,
        cwidth: ['16%', '81%'],
        subTemp: [],
        nEdits: 0,
        name: "",
        message: "",
        activeTab: 0,
    },
    components: {
        tabs: VueStrap.tabs,
        tabGroup: VueStrap.tabGroup,
        tab: VueStrap.tab
    },
    watch: {
        myTipolList: function () {
            this.specReady = false;
            this.restReady = false;
            if (this.myTipolList.length) {
                this.loadSpecificProcs();
            }
            else {
                this.specificProcs = [{ content: [000, "Sem resultados a apresentar..."] }];
                this.specReady = true;
            }
            this.loadRestProcs();
        },
    },
    methods: {
        inputed: function(event){
            
            this.activeTab=event[0];
        },
        loadTipols: function () {
            let orgsToParse = [];
            let keys = ["id", "Tipo", "Nome", "Sigla"];

            this.$http.get("/api/organizacoes")
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    let completeList = this.parseList(orgsToParse, keys);

                    //tipologias
                    this.tipolList = completeList.filter(
                        a => (a.Tipo == "Tipologia")
                    ).map(function (item) {
                        return {
                            label: item.Sigla + " - " + item.Nome,
                            value: item,
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseList: function (content, keys) {
            var dest = [];
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                    if (keys[j] == "Tipo") {

                        conj = new RegExp("#Conjunto", "g");
                        tipol = new RegExp("#Tipologia", "g");

                        if (conj.test(temp.Tipo)) {
                            temp.Tipo = "Conjunto";
                        }
                        else if (tipol.test(temp.Tipo)) {
                            temp.Tipo = "Tipologia";
                        }
                        else {
                            temp.Tipo = "Organização";
                        }
                    }
                }

                dest[i] = JSON.parse(JSON.stringify(temp));
            }

            return dest.sort(function (a, b) {
                return a.id.localeCompare(b.id);
            });
        },
        swap: function (array, pos1, pos2) {
            var temp = array[pos1];
            array[pos1] = array[pos2];
            array[pos2] = temp;

            return array;
        },
        loadSpecificProcs() {
            let content = [];

            this.$http.get("/api/classes/filtrar/" + this.myTipolList.map(a => a.id).join(','))
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {

                    this.specificProcs = [];
                    this.parse(content, this.specificProcs);
                    this.specReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadRestProcs() {
            let content = [];

            this.$http.get("/api/classes/filtrar/restantes/" + this.myTipolList.map(a => a.id).join(','))
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {

                    this.restProcs = [];
                    this.parse(content, this.restProcs);
                    this.restReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        selectClicked: function (params, struct) {
            var id = params.id;

            var path = id.split('.');
            this.selectTree(path, struct, !params.rowData.selected, params);
        },
        selectTree: function (indexes, location, selected, params) {
            if (indexes.length == 1) {
                this.selectSons(location[indexes[0]], selected, params);
            }
            else {
                if (selected) {
                    location[indexes[0]].selected = true;
                }

                //get the path tail
                var tail = indexes.splice(1, indexes.length - 1);

                //next level in the data structure
                var newLocation = location[indexes[0]].sublevel;

                this.selectTree(tail, newLocation, selected, params);
            }
        },
        selectSons: function (location, selected, params) {
            if (!selected) {
                if (location.owner) {
                    location.owner = false;
                }
                if (location.participant) {
                    location.participant = false;
                }
            }

            location.selected = selected;
            var tempParams = null;

            if (location.sublevel && location.sublevel.length) {
                for (var i = 0; i < location.sublevel.length; i++) {
                    tempParams = JSON.parse(JSON.stringify(params));
                    tempParams.id += "." + i;

                    this.selectSons(location.sublevel[i], selected, tempParams);
                }
            }
            else if (location.sublevel && !location.sublevel.length) {
                this.dropClicked(params);
            }
        },
        parse: function (dataToParse, destination) {
            const indexes = {};
            let avo;
            let pai;

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
                            selected: false,
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
                        selected: false,
                        subReady: true,
                        sublevel: [{
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai, pn.PaiTitulo.value],
                            drop: false,
                            selected: false,
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
                    selected: false,
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
                            selected: false,
                        });
                    }
                }
                destination[avo].sublevel[pai].sublevel.push(pninfo);
            }
        },
        getSelected: function (location) {
            var list = [];

            for (var i = 0; i < location.length; i++) {
                //if a node is selected add its ID to the list and check its descendants
                if (location[i].selected) {
                    list.push(location[i].codeID);


                    if (location[i].sublevel && location[i].sublevel.length) {
                        list = list.concat(this.getSelected(location[i].sublevel));
                    }
                }
            }
            return list;
        },
        getAllSelected: function () {
            var list = [];

            list = list.concat(this.getSelected(this.commonProcs))
                .concat(this.getSelected(this.specificProcs))
                .concat(this.getSelected(this.restProcs));

            return Array.from(new Set(list));
        },
        saveInfo: function () {
            let selected = {
                comuns: this.getSelected(this.commonProcs),
                tipols: this.myTipolList,
                especificos: this.getSelected(this.specificProcs),
                restantes: this.getSelected(this.restProcs),
            };

            /* do stuff */
        },
        loadSavedInfo: function () {
            /* get info */
            /* apply info */
        },
        createSelTab: function () {
            var dataObj = {
                name: this.name,
                classes: this.getAllSelected(this.tableData),
            }

            if (dataObj.classes.length == 0) {
                this.message = "É necessário selecionar uma ou mais classes!";
            }
            else {
                this.$http.post('/api/tabelasSelecao/', dataObj, {
                    headers: {
                        'content-type': 'application/json'
                    }
                })
                    .then(function (response) {
                        window.location.href = '/tabelasSelecao/consultar/' + response.body;
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            }
        }
    },
    created: function () {
        this.tableHeader = [
            "CLASSE",
            "TÍTULO"
        ];

        let content = [];

        this.$http.get("/api/classes/filtrar/comuns")
            .then(function (response) {
                content = response.body;
            })
            .then(function () {
                this.parse(content, this.commonProcs);
                this.ready = true;

                this.loadTipols();
                this.loadRestProcs();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})