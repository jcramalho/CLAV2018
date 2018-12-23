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

            processosRelacionados: {
                'eAntecessorDe': [],
                'eSucessorDe': [],
                'eComplementarDe': [],
                'eCruzadoCom': [],
                'eSinteseDe': [],
                'eSintetizadoPor': [],
                'eSuplementoDe': [],
                'eSuplementoPara': []
            },

            // Legislação Associada
        },

        // Estruturas auxiliares

        classesPai: [],
        entidadesD: [],
        entidadesP: [],
        listaProcessos: [],

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
            processosRelacionadosTableHeader: ['Relação', 'Processo', 'Título'],
            processosRelacionadosTableWidth: ['20%', '15%', '65%'],
            legislacaoTableHeader: ["#", "Tipo", "Número", "Título", "Data"],
            legislacaoTableWidth: ['5%', '19%', '11%', '50%', '15%']
        },

    // Mensagens de validação

        mensValCodigo: "",

        legsReady: false,
        
        
        legList: [],
        selectedLegs: [],
        
        relationsSelected: [],
        relationsSelectedInfo: [],

        status: "H",

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
                this.loadPais();
            }
            if (this.classe.nivel >= 3 && !this.classesReady) {
                this.loadProcessos();
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
    },
    // Função principal que cria as estruturas necessárias com informação da BD....................

    created: function () {
        this.loadEntidades();
        this.loadProcessos();
        this.loadLegislacao();
        // this.loadCountTypes();
        // this.loadSubCountTypes();
    },
    methods: {
        // Carrega as entidades da BD....................

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
        // Carrega os Processos da BD....................

        loadProcessos: function () {
            this.ready = false;
            let content = [];

            this.$http.get("/api/classes/nivel/3")
                .then(function (response) {
                    this.listaProcessos = response.body
                        .map(function (item) {
                                        return {
                                            data: ["Por Selecionar", item.codigo, item.titulo],
                                            selected: false,
                                            id: item.id.split('#')[1]
                                        }
                                    })
                        .sort(function (a, b) {
                            return a.data[0].localeCompare(b.data[0]);
                        });
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        // Carrega a legislação da BD....................

        loadLegislacao: function () {
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
        // Carrega os potenciais pais da BD, quando alguém muda o nível para >1....................

        loadPais: function () {
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
                    this.semaforos.paisReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        // Verifica se o código introduzido pelo utilizador já existe na BD....................

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
        // Trata a seleção ou desseleção de um dono....................

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
        // Trata a seleção ou desseleção de um participante....................

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

        // Trata a seleção ou desseleção de um processo....................

        selecionarProcesso: function (row) {
            if (!row.selected) {
                this.classe.processosRelacionados[row.data[0]].push(row.id);
            }
            else {
                let index = this.classe.processosRelacionados[row.data[0]].indexOf(row.id);
                if (index != -1) {
                    this.classe.processosRelacionados[row.data[0]].splice(index, 1);
                }
            } 
        },

        showMsg(text) {
            this.modalMsg = text;
            this.modalMsgShow = true;
        },
        
        // Vai adicionar a nova classe/processo à lista de pedidos

        add: function () {
            alert(JSON.stringify(this.classe))
        }
    }
})