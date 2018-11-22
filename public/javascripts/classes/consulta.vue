var classe = new Vue({
    el: '#classe-form',
    data: {
        message: "",
        id: "",
        
        clas: {
            titulo: "",
            filhos: [],
            codigo: "",
            pai: {
                id: "",
                codigo: "",
                titulo: "",
            },
            status: "",
            desc: "",
            notasAp: [],
            exemplosNotasAp: [],
            notasEx: [],
            ti: [],
            procTipo: "",
            procTrans: "",
            donos: [],
            participantes: [],
            participacaoGroupBy: {
                Apreciador: {label: "Apreciar", membros: []},
                Assessor: {label: "Assessorar", membros: []},
                Comunicador: {label: "Comunicar", membros: []},
                Decisor: {label: "Decidir", membros: []},
                Executor: {label: "Executar", membros: []},
                Iniciador: {label: "Iniciar", membros: []}
            },
            procRel: [],
            procRelTipoGroupBy: {
                eAntecessorDe: {label: "É Antecessor de", membros: []},
                eSucessorDe: {label: "É Sucessor de", membros: []},
                eComplementarDe: {label: "É Complementar de", membros: []},
                eCruzadoCom: {label: "É Cruzado com", membros: []},
                eSinteseDe: {label: "É Síntese de", membros: []},
                eSintetizadoPor: {label: "É Sintetizado por", membros: []},
                eSuplementoDe: {label: "É Suplemento de", membros: []},
                eSuplementoPara: {label: "É Suplemento para", membros: []}
            },

            legislacao: [],
            
            pca: {},
            df: {},
            notas: [] 
        },

        notasApReady: false,
        notasExReady: false,
        exemplosNotasApReady: false,
        donosReady: false,
        participantesReady: false,
        procRelReady: false,
        legislacaoReady: false,
        pcaReady: false,
        dfReady: false,
        
        pageReady: false,
        countsReady: false,
        subcountsReady: false,
        critRelsReady: false,
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
    methods: {
        prepData: function (dataObj) { // dataObj é um array com um objeto
            
            this.clas.titulo = dataObj.titulo;
            this.clas.codigo = dataObj.codigo;

            if (dataObj.status) {
                this.clas.status = dataObj.status;
            }

            if (this.clas.Level > 1) {
                this.clas.pai.id = dataObj.pai;
                this.clas.pai.codigo = dataObj.codigoPai;
                this.clas.pai.titulo = dataObj.tituloPai;
            }

            this.loadDescendencia();

            this.pageReady = true;

            if (dataObj.desc) {
                this.clas.desc = dataObj.desc;
            }

            this.loadNotasAp();
            this.loadNotasEx();
            this.loadNotasApExemplos();
            this.loadTI();

            if (this.clas.Level >= 3) {

                if (dataObj.procTipo) {
                    this.clas.procTipo = dataObj.procTipo;
                }
                if (dataObj.procTrans) {
                    this.clas.procTrans = dataObj.procTrans;
                }

                this.loadDonos();
                this.loadParticipantes();
                this.loadProcRel();
                this.loadLegislacao();

                this.loadPCA();
                this.loadDF();
            }

        },
        loadTI: function () {
            this.$http.get("/api/classes/" + this.id + "/ti")
                .then(function (response) {
                    this.clas.ti = response.body;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadDescendencia: function () {
            this.$http.get("/api/classes/" + this.id + "/descendencia")
                .then(function (response) {
                    this.clas.filhos = response.body;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadNotasAp: function () {
            this.$http.get("/api/classes/" + this.id + "/notasAp")
                .then(function (response) {
                    this.clas.notasAp = response.body;
                    this.notasApReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadNotasEx: function () {
            this.$http.get("/api/classes/" + this.id + "/notasEx")
                .then(function (response) {
                    this.clas.notasEx = response.body;
                    this.clas.notasEx = this.clas.notasEx.map(
                        function(a){
                            a.nota = a.nota.replace(
                                /([0-9]{3}(\.?[0-9]+)*)/g,
                                '<a href="/classes/consultar/c$1">$1</a>'
                            )
                            return a;
                        });
                    this.notasExReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadNotasApExemplos: function () {
            this.$http.get("/api/classes/" + this.id + "/exemplosNotasAp")
                .then(function (response) {
                    this.clas.exemplosNotasAp = response.body;
                    this.exemplosNotasApReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadDonos: function () {
            this.$http.get("/api/classes/" + this.id + "/dono")
                .then(function (response) {
                    this.clas.donos = response.body;
                    this.clas.donos = this.clas.donos.map(
                        function(a){
                            a.tipo = a.tipo.split('#')[1];
                            a.id = a.id.split('#')[1];
                            return a;
                        });
                    this.donosReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipantes: function () {
            this.$http.get("/api/classes/" + this.id + "/participante")
                .then(function (response) {
                    this.clas.participantes = response.body;
                    for(var i=0; i < this.clas.participantes.length; i++){
                        this.clas.participantes[i].tipoParticip = this.clas.participantes[i].tipoParticip.split('#temParticipante')[1]
                        this.clas.participantes[i].id = this.clas.participantes[i].id.split('#')[1]
                        this.clas.participacaoGroupBy[this.clas.participantes[i].tipoParticip].membros.push(this.clas.participantes[i])
                    }
                    this.participantesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadProcRel: function () {
            this.$http.get("/api/classes/" + this.id + "/procRel")
                .then(function (response) {
                    this.clas.procRel = response.body;
                    for(var i=0; i < this.clas.procRel.length; i++){
                        this.clas.procRel[i].tipoRel = this.clas.procRel[i].tipoRel.split('#')[1]
                        this.clas.procRelTipoGroupBy[this.clas.procRel[i].tipoRel].membros.push(this.clas.procRel[i])
                    }
                    this.procRelReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadLegislacao: function () {
            this.$http.get("/api/classes/" + this.id + "/legislacao")
                .then(function (response) {
                    this.clas.legislacao = response.body;
                    this.clas.legislacao = this.clas.legislacao.map(
                        function(a){
                            a.id = a.id.split('#')[1]
                            return a;
                        });
                    this.legislacaoReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        
        
        loadPCA: function () {
            this.pcaReady = false;
            this.$http.get("/api/classes/" + this.id + "/pca")
                .then(function (response) {
                    this.clas.pca = response.body[0]; // 1 PCA == primeiro e único elemento
                    if(this.clas.pca.valores.length>0)
                        this.clas.pca.valores = this.clas.pca.valores.split('###')
                    if(this.clas.pca.notas.length>0)
                        this.clas.pca.notas = this.clas.pca.notas.split('###')
                    
                    this.$http.get("/api/classes/justificacao/" + this.clas.pca.idJustificacao.split('#')[1])
                        .then(function (response){
                            this.clas.pca.justificacao = response.body;
                            this.pcaReady = true;
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        
        loadDF: function () {
            this.dfReady = false;
            this.$http.get("/api/classes/" + this.id + "/df")
                .then(function (response) {
                    this.clas.df = response.body[0]; // 1 DF == primeiro e único elemento

                    this.$http.get("/api/classes/justificacao/" + this.clas.df.idJustificacao.split('#')[1])
                        .then(function (response){
                            this.clas.df.justificacao = response.body;
                            this.clas.df.justificacao = this.clas.df.justificacao.map(
                                function(a){
                                    a.conteudo = a.conteudo.replace(/PN[ ]*([0-9]{3}\.[0-9]{2}\.[0-9]{3})/g,
                                                                    '<a href="/classes/consultar/c$1">PN $1</a>')
                                    return a;
                                });
                            this.dfReady = true;
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                })
                .catch(function (error) {
                    console.error(error);
                });
        },

    },
    created: function () {
        this.id = window.location.pathname.split('/')[3];
        this.clas.Level = this.id.split('.').length;

        this.$http.get("/api/classes/" + this.id)
            .then(function (response) {
                // neste caso o resultado é um array singular
                this.prepData(response.body[0]); 
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})