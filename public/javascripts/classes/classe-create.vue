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

            legislacao: [],

            // PCA

            pca: {
                valor: null,
                formaContagem: "",
                subFormaContagem: "",
                justificacao: []        // j = [criterio]
            },                          // criterio = {tipo, notas, [proc], [leg]}

            df: {
                valor: "NE",
                notas: null,
                justificacao: []
            }
        },

        // Estruturas auxiliares

        classesPai: [],
        entidadesD: [],
        entidadesP: [],
        listaProcessos: [],
        listaLegislacao: [],
        classeNiveis: [
            {label: 'Nível 1', value: '1'},
            {label: 'Nível 2', value: '2'},
            {label: 'Nível 3', value: '3'},
            {label: 'Nível 4', value: '4'}
        ],
        pcaFormasContagem: [{label: "Por selecionar", value: "Indefinido"}],
        pcaSubFormasContagem: [{label: "Por selecionar", value: "Indefinido"}],
        pcaTiposCriterio: [
            {label: 'Por selecionar', value: 'Indefinido'},
            {label: 'Critério Gestionário', value: 'CriterioJustificacaoGestionario'},
            {label: 'Critério Legal', value: 'CriterioJustificacaoLegal'},
            {label: 'Critério Utilidade Administrativa', value: 'CriterioJustificacaoUtilidadeAdministrativa'}
        ],

        destinoFinalTipos: [
            {label: 'Não Especificado (NE)', value: 'NE'},
            {label: 'Conservação (C)', value: 'C'},
            {label: 'Conservação Parcial (CP)', value: 'CP'},
            {label: 'Eliminação (E)', value: 'E'}
        ],

        criteriosDF: [
            {label: 'Por selecionar', value: 'Indefinido'},
            {label: 'Critério Complementaridade Informacional', value: 'CriterioJustificacaoComplementaridadeInfo'},
            {label: 'Critério Densidade Informacional', value: 'CriterioJustificacaoDensidadeInfo'},
            {label: 'Critério Legal', value: 'CriterioJustificacaoLegal'}
        ],

        semaforos: {
            paisReady: false,
            classesReady: false,
            entidadesReady: false,
            legislacaoReady: false,
            pcaFormasContagemReady: false,
            pcaSubFormasContagemReady: false,
        },

        estilo: {
            entidadesTableHeader: ["Sigla", "Designacao", "Tipo"],
            entidadesTableWidth: ["15%", "70%", "15%"],
            participantesTableHeader: ["Intervenção", "Sigla", "Designacao", "Tipo"],
            participantesTableWidth: ["15%", "15%", "55%", "15%"],
            processosRelacionadosTableHeader: ['Relação', 'Processo', 'Título'],
            processosRelacionadosTableWidth: ['20%', '15%', '65%'],
            legislacaoTableHeader: ["Tipo", "Número", "Sumário", "Data"],
            legislacaoTableWidth: ['20%', '15%', '50%', '15%']
        },

    // Mensagens de validação

        mensValCodigo: "",
        mensValTermoIndice: "Termo de Índice já existente!",
        
        relationsSelected: [],
        relationsSelectedInfo: [],

        status: "H",
        
        message: null,

        modalMsgShow: false,
        modalMsg: "",
    },
    watch: {
        'classe.pai': function () {
            // O código da classe depende da classe pai
            this.classe.codigo = null;
            if(this.classe.pai)
                this.classe.codigo = this.classe.pai.slice(1, this.classe.pai.length) + ".";
        },
        'classe.nivel': function () {
            // A classe pai depende do nível 
            this.classe.pai = null;
            
            if (this.classe.nivel > 1) {
                this.loadPais();
            }
            if (this.classe.nivel >= 3 && !this.classesReady) {
                this.loadProcessos();
            }
            if(this.classe.nivel >= 3){
                this.loadPCA();
            }
            sideNav.changeNav(this.classe.nivel);
        },
        'classe.codigo': function () {
            this.mensValCodigo = "";
            // O código das notasAp, dos termos de índice depende do código da classe
            this.classe.notasAp = [];
            this.classe.termosInd = [];

            if (this.classe.nivel > 1) {
                if (this.classe.codigo.indexOf(this.classe.pai.slice(1, this.classe.pai.length)) != 0) {
                    this.classe.codigo = this.classe.pai.slice(1, this.classe.pai.length) + ".";
                }
                if (this.classe.codigo[this.classe.pai.length - 1] != '.') {
                    this.classe.codigo = this.classe.pai.slice(1, this.classe.pai.length) + ".";
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

            this.$http.get("/api/legislacao?estado=A")
                .then(response => {
                    this.listaLegislacao = response.body
                        .map(function (item) {
                            return {
                                data: [item.tipo, item.numero, item.sumario, item.data],
                                selected: false,
                                id: item.id
                            }
                        })
                        .sort(function (a, b) {
                            return -1 * a.data[3].localeCompare(b.data[3]);
                        });
                    this.semaforos.legislacaoReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        // Carrega a informação contextual relativa ao PCA: formas de contagem, etc....................

        loadPCA: function(){
            this.loadPCAFormasContagem();
            this.loadPCASubFormasContagem();
        },

        // Carrega as possíveis formas de contagem do PCA....................

        loadPCAFormasContagem: function(){
            this.$http.get("/api/vocabularios/vc_pcaFormaContagem")
                .then(function(response){
                    this.pcaFormasContagem = this.pcaFormasContagem.concat(response.body.map(function (item) {
                        return {
                            label: item.termo,
                            value: item.idtermo.split('#')[1],
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    }));
                    this.semaforos.pcaFormasContagemReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },

        // Carrega as possíveis subformas de contagem do PCA....................

        loadPCASubFormasContagem: function(){
            this.$http.get("/api/vocabularios/vc_pcaSubformaContagem")
                .then(function(response){
                    this.pcaSubFormasContagem = this.pcaSubFormasContagem.concat(response.body.map(function (item) {
                        var formaID = item.termo.substring(item.termo.length - 6)
                        return {
                            label: formaID + ": " + item.desc.substring(0, 60) + "...",
                            value: item.idtermo.split('#')[1],
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    }));
                    this.semaforos.pcaSubFormasContagemReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },

        // Carrega os potenciais pais da BD, quando alguém muda o nível para >1....................

        loadPais: function () {
            this.classesPai = [{label: 'Por selecionar', value: 'Indefinido'}];
            this.$http.get("/api/classes/nivel/" + (this.classe.nivel - 1))
                .then(function (response) {
                    this.classesPai = this.classesPai.concat(response.body.map(function (item) {
                        return {
                            label: item.codigo + " - " + item.titulo,
                            value: item.id.split('#')[1],
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    }));
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
            if (row.selected) {
                this.classe.participantes[row.nova].push(row.id);
                row.data[0] = row.nova;
            }
            else {
                let index = this.classe.participantes[row.data[0]].indexOf(row.id);
                if (index != -1) {
                    this.classe.participantes[row.data[0]].splice(index, 1);
                }
            } 
        },

        // Trata a seleção ou desseleção de um processo....................

        selecionarProcesso: function (row, classe) {
            if (row.selected) {
                this.classe.processosRelacionados[row.nova].push(row.id);
                row.data[0] = row.nova;
            }
            else {
                let index = this.classe.processosRelacionados[row.data[0]].indexOf(row.id);
                if (index != -1) {
                    this.classe.processosRelacionados[row.data[0]].splice(index, 1);
                }
            } 
            // Tratamento do invariante: se é Suplemento Para então cria-se um critério de Utilidade Administrativa
            if(row.nova == "eSuplementoPara"){
                this.adicionarCriterio(this.classe.pca.justificacao, "CriterioJustificacaoUtilidadeAdministrativa", "", [row.id], []);
            }
        },
        // Trata a seleção ou desseleção de um diploma legislativo....................

        selecionarLegislacao: function (row) {
            if (!row.selected) {
                this.classe.legislacao.push(row.id);
            }
            else {
                let index = this.classe.legislacao.indexOf(row.id);
                if (index != -1) {
                    this.classe.legislacao.splice(index, 1);
                }
            }
        },

        // Adiciona um critério à lista de critérios do PCA ou do DF....................

        adicionarCriterio: function (justificacao, tipo, notas, procRel, legislacao) {
            var indice = justificacao.findIndex(crit => crit.tipo === tipo);
            if(indice == -1){
                justificacao.push({
                    tipo: tipo,
                    notas: notas,
                    procRel: procRel,
                    legislacao: legislacao
                });
            }
            else{
                justificacao[indice].procRel = justificacao[indice].procRel.concat(procRel);
            }
            
        },

        // Verifica se um TI já existe na BD

        validaTI: async function(ti) {
            try {
                let response = await axios.get("/api/termosIndice?existe=" + ti.termo)
                ti.existe = response.data
                return response.data
            } 
            catch (error) {
                console.error(error)
            }    
        },

        showMsg(text) {
            this.modalMsg = text;
            this.modalMsgShow = true;
        },
        
        // Vai adicionar a nova classe/processo à lista de pedidos

        criarClasse: function () {
            alert("Neste momento, ainda não está pronta. A classe seria criada com a informação: " + JSON.stringify(this.classe))
        }
    }
})