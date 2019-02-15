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

        activeTab: 1,

    // Objeto que guarda uma classe

        classe: {
            // Metainformação e campos da área de Descrição

            nivel: 1,
            pai: "",
            codigo: "",
            titulo: "",
            descricao: "",
            notasAp: [],
            exemplosNotasAp: [],
            notasEx: [],
            termosInd: [],

            temSubclasses4Nivel: false,
            temSubclasses4NivelPCA: false,
            temSubclasses4NivelDF: false,
            subdivisao4Nivel01Sintetiza02: true,

            // Campos da área do Contexto de Avaliação
            // Tipo de processo

            tipoProc: "PC",
            procTrans: "N",

            // Donos do processo: lista de entidades

            donos: [],

            // Participantes no processo: lista de entidades

            participantes: [],

            // Processos Relacionados

            processosRelacionados: [],

            // Legislação Associada

            legislacao: [],

            // Bloco de decisão de avaliação: PCA e DF

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
            },

            // Bloco de subclasses de nível 4, caso haja desdobramento

            subclasses: []
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
            {label: 'Nível 3', value: '3'}
        ],

        processoTipos: [
            {label: "Processo Comum", value: "PC"},
            {label: "Processo Específico", value: "PE"}
        ],
        
        simNao: [
            {label: "Não", value: "N"},
            {label: "Sim", value: "S"}
        ],

        trueFalse: [
            {label: "Não", value: false},
            {label: "Sim", value: true}
        ],

        razaoDesdobramento: [
            {label: "PCA distinto", value: "PCA"},
            {label: "DF distinto", value: "DF"}
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

        destinoFinalLabels: {
            'NE': 'Não Especificado (NE)', 
            'C': 'Conservação (C)',
            'CP': 'Conservação Parcial (CP)',
            'E': 'Eliminação (E)'
        },

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

        textoCriterioGestionario: "Prazo para imputação de responsabilidade pela gestão estratégica, decorrente de" +
                                    " escrutínio público (eleições) ou da não recondução no mandato. Considerou-se para" +
                                    " a definição do prazo o tempo do mandato de maior duração: 5 anos.",

    // Mensagens de validação

        mensValCodigo: "",
        mensValTermoIndice: "Termo de Índice já existente!",
        
        relationsSelected: [],
        relationsSelectedInfo: [],

        status: "H",
        
        message: null,

        modalMsgShow: false,
        modalMsg: "",
        helpWindow: null,
    },
    watch: {
        'classe.pai.codigo': function () {
            // O código da classe depende da classe pai
            this.classe.codigo = null;
            if(this.classe.pai.codigo)
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
        'classe.temSubclasses4Nivel': function(){
            // Se passou a verdade vamos criar um par de subclasses
            // Informação base:
            if(this.classe.temSubclasses4Nivel){
                var novaSubclasse1 = {
                    nivel: 4,
                    pai: this.classe.codigo,
                    codigo: this.classe.codigo + '.01',
                    titulo: this.classe.titulo + ': ',
                    descricao: null,
                    termosInd: JSON.parse(JSON.stringify(this.classe.termosInd)),

                    // Bloco de contexto de avaliação

                    processosRelacionados: JSON.parse(JSON.stringify(this.classe.processosRelacionados)),
                    legislacao: JSON.parse(JSON.stringify(this.classe.legislacao)),

                    // Bloco de decisão de avaliação: PCA e DF

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
                };
                var novaSubclasse2 = {
                    nivel: 4,
                    pai: this.classe.codigo,
                    codigo: this.classe.codigo + '.02',
                    titulo: this.classe.titulo + ': ',
                    descricao: "",
                    termosInd: JSON.parse(JSON.stringify(this.classe.termosInd)),
                    
                    // Bloco de contexto de avaliação

                    processosRelacionados: JSON.parse(JSON.stringify(this.classe.processosRelacionados)),
                    legislacao: JSON.parse(JSON.stringify(this.classe.legislacao)),
                    
                    // Bloco de decisão de avaliação: PCA e DF

                    pca: {
                        valor: null,
                        formaContagem: "",
                        subFormaContagem: "",
                        justificacao: []  
                    },                          

                    df: {
                        valor: "NE",
                        notas: null,
                        justificacao: []
                    }
                };

                this.procHeranca(this.classe.processosRelacionados, novaSubclasse1);
                this.procHeranca(this.classe.processosRelacionados, novaSubclasse2);

                this.classe.subclasses.push(novaSubclasse1);
                this.classe.subclasses.push(novaSubclasse2);
            }

            // Se passou a falso vamos eliminar as subclasses

            else{
                for(var j=0; j < this.classe.subclasses.length; j++){
                    this.classe.subclasses[j].processosRelacionados.splice(0, this.classe.subclasses[j].processosRelacionados.length);
                }
                this.classe.subclasses.splice(0, this.classe.subclasses.length);
                this.classe.temSubclasses4NivelPCA = false;
                this.classe.temSubclasses4NivelDF = false;
            }  
        },
        'classe.temSubclasses4NivelDF': function(){
            if(this.classe.temSubclasses4NivelDF)
                this.calcSinteseDF4Nivel();
        },
        'classe.subdivisao4Nivel01Sintetiza02': function(){
            this.remSintese4Nivel(this.classe.subclasses);
            this.calcSinteseDF4Nivel();
        }
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
                                data: [item.sigla, item.designacao, "Entidade", "Indefinido"],
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
                                            data: [item.sigla, item.designacao, "Tipologia", "Indefinido"],
                                            selected: false,
                                            id: item.id
                                        }
                                    })
                            ).sort(function (a, b) {
                                return a.data[1].localeCompare(b.data[1]);
                            });

                            this.entidadesP = JSON.parse(JSON.stringify(this.entidadesD));

                            // teste com alteração do modelo da linha para  participantes
                            this.entidadesP = this.entidadesP.map(function (ent) {
                                        return {
                                            selected: false,
                                            id: ent.id,
                                            sigla: ent.data[0],
                                            designacao: ent.data[1],
                                            tipo: ent.data[2],
                                            intervencao: ent.data[3]
                                        }
                                    })
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
            this.$http.get("/api/classes?nivel=3")
                .then(function (response) {
                    this.listaProcessos = response.body
                        .map(function (item) {
                                        return {
                                            selected: false,
                                            id: item.id.split('#')[1],
                                            codigo: item.codigo,
                                            titulo: item.titulo,
                                            relacao: "Indefinido"
                                        }
                                    })
                        .sort(function (a, b) {
                            return a.codigo.localeCompare(b.codigo);
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
                            label: formaID + ": " + item.desc.substring(0, 70) + "...",
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
            this.$http.get("/api/classes?nivel=" + (this.classe.nivel - 1))
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
            this.classe.donos.push(row);
            row.selected = true;
        },

        desselecionarDono: function (row, index) {
            row.selected = false;
            this.classe.donos.splice(index, 1);
        },
        
        // Trata a seleção ou desseleção de um participante....................

        selecionarParticipante: function (row) {
            this.classe.participantes.push(row);
        },

        desselecionarParticipante: function(p, index) {
            p.selected = false;
            p.intervencao = "Indefinido";
            this.classe.participantes.splice(index,1);
        },

        // Trata a seleção ou desseleção de um processo....................
        

        selecionarProcesso: function (row) {
            this.classe.processosRelacionados.push(row);
            for(var i=0; i < this.classe.subclasses.length; i++){
                this.classe.subclasses[i].processosRelacionados.push(row);
            }
            this.classe.df.valor = this.calcDF(this.classe.processosRelacionados);
            if(!this.classe.temSubclasses4Nivel){
                // Tratamento do invariante: se é Suplemento Para então cria-se um critério de Utilidade Administrativa
                if(row.relacao == "eSuplementoPara"){
                    this.adicionarCriterio(this.classe.pca.justificacao, "CriterioJustificacaoUtilidadeAdministrativa", "Critério de Utilidade Administrativa", "", [row], []);
                }
                // Tratamento do invariante: se é Suplemento De então cria-se um critério Legal com toda a legislação selecionada associada
                else if(row.relacao == "eSuplementoDe"){
                    this.adicionarCriterio(this.classe.pca.justificacao, "CriterioJustificacaoLegal", "Critério Legal", "", [row], this.classe.legislacao);
                }
                // Tratamento do invariante: se é Síntese De então cria-se um critério de Densidade Informacional
                else if(row.relacao == "eSinteseDe"){
                    this.adicionarCriterio(this.classe.df.justificacao, "CriterioJustificacaoDensidadeInfo", "Critério de Densidade Informacional", "", [row], []);
                }
                // Tratamento do invariante: se é Síntetizado Por então cria-se um critério de Densidade Informacional
                else if(row.relacao == "eSintetizadoPor"){
                    this.adicionarCriterio(this.classe.df.justificacao, "CriterioJustificacaoDensidadeInfo", "Critério de Densidade Informacional", "", [row], []);
                }
                // Tratamento do invariante: se é Complementar De então cria-se um critério de Complementaridade Informacional
                else if(row.relacao == "eComplementarDe"){
                    this.adicionarCriterio(this.classe.df.justificacao, "CriterioJustificacaoComplementaridadeInfo", "Critério de Complementaridade Informacional", "", [row], []);
                }
            }
            else{
                // Tratamento do invariante: se é Suplemento Para 
                // então cria-se um critério de Utilidade Administrativa para todas as subclasses
                if(row.relacao == "eSuplementoPara"){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.adicionarCriterio(this.classe.subclasses[i].pca.justificacao, "CriterioJustificacaoUtilidadeAdministrativa", "Critério de Utilidade Administrativa", "", [row], []);
                    }
                }

                // Tratamento do invariante: se é Suplemento De então 
                // cria-se um critério Legal com toda a legislação selecionada associada para todas as subclasses
                else if(row.relacao == "eSuplementoDe"){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.adicionarCriterio(this.classe.subclasses[i].pca.justificacao, "CriterioJustificacaoLegal", "Critério Legal", "", [row], this.classe.legislacao);
                    }    
                }

                // Tratamento do invariante: se é Síntese De então 
                // cria-se um critério de Densidade Informacional para todas as subclasses
                else if(row.relacao == "eSinteseDe"){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.adicionarCriterio(this.classe.subclasses[i].df.justificacao, "CriterioJustificacaoDensidadeInfo", "Critério de Densidade Informacional", "", [row], []);
                    } 
                }

                // Tratamento do invariante: se é Síntetizado Por então 
                // cria-se um critério de Densidade Informacional
                else if(row.relacao == "eSintetizadoPor"){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.adicionarCriterio(this.classe.subclasses[i].df.justificacao, "CriterioJustificacaoDensidadeInfo", "Critério de Densidade Informacional", "", [row], []);
                    }
                }

                // Tratamento do invariante: se é Complementar De então cria-se um critério de Complementaridade Informacional
                else if(row.relacao == "eComplementarDe"){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.adicionarCriterio(this.classe.subclasses[i].df.justificacao, "CriterioJustificacaoComplementaridadeInfo", "Critério de Complementaridade Informacional", "", [row], []);
                    }
                }

                // No fim, recalcula-se o DF para todas as subclasses
                for(var i=0; i < this.classe.subclasses.length; i++){
                    this.classe.subclasses[i].df.valor = this.calcDF(this.classe.subclasses[i].processosRelacionados);
                }
            }
        },

        desselecionarProcesso: function(p, index) {
            p.selected = false;
            if(p.relacao == "eSuplementoPara") {
                this.removerCriterio(this.classe.pca.justificacao, "CriterioJustificacaoUtilidadeAdministrativa", p.id);
                if(this.classe.temSubclasses4Nivel){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.removerCriterio(this.classe.subclasses[i].pca.justificacao, "CriterioJustificacaoUtilidadeAdministrativa", p.id);
                    }
                }
            }
            else if(p.relacao == "eSuplementoDe") {
                this.removerCriterio(this.classe.pca.justificacao, "CriterioJustificacaoLegal", p.id);
                if(this.classe.temSubclasses4Nivel){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.removerCriterio(this.classe.subclasses[i].pca.justificacao, "CriterioJustificacaoLegal", p.id);
                    }
                }
            }
            else if(p.relacao == "eSinteseDe"){
                this.removerCriterio(this.classe.df.justificacao, "CriterioJustificacaoDensidadeInfo", p.id);
                if(this.classe.temSubclasses4Nivel){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.removerCriterio(this.classe.subclasses[i].df.justificacao, "CriterioJustificacaoDensidadeInfo", p.id);
                    }
                }
            }
            else if(p.relacao == "eSintetizadoPor"){
                this.removerCriterio(this.classe.df.justificacao, "CriterioJustificacaoDensidadeInfo", p.id);
                if(this.classe.temSubclasses4Nivel){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.removerCriterio(this.classe.subclasses[i].df.justificacao, "CriterioJustificacaoDensidadeInfo", p.id);
                    }
                }
            }
            else if(p.relacao == "eComplementarDe"){
                this.removerCriterio(this.classe.df.justificacao, "CriterioJustificacaoComplementaridadeInfo", p.id);
                if(this.classe.temSubclasses4Nivel){
                    for(var i=0; i < this.classe.subclasses.length; i++){
                        this.removerCriterio(this.classe.subclasses[i].df.justificacao, "CriterioJustificacaoComplementaridadeInfo", p.id);
                    }
                }
            }
            p.relacao = "Indefinido";
            this.classe.processosRelacionados.splice(index,1);
            if(this.classe.temSubclasses4Nivel){
                for(var i=0; i < this.classe.subclasses.length; i++){
                    var k = this.classe.subclasses[i].processosRelacionados.findIndex((proc => proc.codigo == p.codigo));
                    if(k != -1) this.classe.subclasses[i].processosRelacionados.splice(k,1);
                }
            }
            
            // No fim recalcula-se o valor do destino final
            this.classe.df.valor = this.calcDF(this.classe.processosRelacionados);
            if(this.classe.temSubclasses4Nivel){
                for(i=0; i < this.classe.subclasses.length; i++){
                    this.classe.subclasses[i].df.valor = this.calcDF(this.classe.subclasses[i].processosRelacionados);
                }
            }
        },
        
        // Trata a seleção ou desseleção de um diploma legislativo....................

        selecionarLegislacao: function (row) {
            this.classe.legislacao.push(row);
            for(var i=0; i < this.classe.subclasses.length; i++){
                this.classe.subclasses[i].legislacao.push(row);
            }
            row.selected = true;
        },

        desselecionarLegislacao: function (lista, row, index) {
            row.selected = false;
            lista.splice(index, 1);
        },

        desselecionarLegislacao3N: function (row, index) {
            row.selected = false;
            this.classe.legislacao.splice(index, 1);
            for(var i=0; i < this.classe.subclasses.length; i++){
                var k = this.classe.subclasses[i].legislacao.findIndex((leg => leg.id == row.id));
                if(k != -1) this.classe.subclasses[i].legislacao.splice(k,1);
            }
        },

        // Adiciona um critério à lista de critérios do PCA ou do DF....................

        adicionarCriterio: function (justificacao, tipo, label, notas, procRel, legislacao) {
            let myProcRel = JSON.parse(JSON.stringify(procRel));
            let myLeg = JSON.parse(JSON.stringify(legislacao));
            
            var indice = justificacao.findIndex(crit => crit.tipo === tipo);
            if(indice == -1){
                justificacao.push({
                    tipo: tipo,
                    label, label,
                    notas: notas,
                    procRel: myProcRel,
                    legislacao: myLeg
                });
            }
            else{
                justificacao[indice].procRel = justificacao[indice].procRel.concat(myProcRel);
                justificacao[indice].legislacao = justificacao[indice].legislacao.concat(myLeg);
            }
            
        },

        // Remove um PN dum critério e se este ficar sem PNs, remove o critério também:
        // criterio = {tipo: String, notas: [String], procRel: [proc], legislacao: [leg]}

        removerCriterio: function(justificacao, tipo, pid){
            var i = justificacao.findIndex(crit => crit.tipo === tipo);

            if(i != -1){
                var j = justificacao[i].procRel.findIndex(p => p.id == pid);
                if (j != -1) {
                    justificacao[i].procRel.splice(j, 1);
                }
                if(justificacao[i].procRel.length == 0){
                    justificacao.splice(i, 1)
                }
            } 
        },

        // Remove um critério completo duma vez

        removerCriterioTodo: function(justificacao, i){
            justificacao.splice(i, 1)
        },

        // Verifica se um TI já existe na BD

        findTI: async function(listaTI, termo, index){
            try{
                var encontrado = false;
                for(var i=0; (i < listaTI.length) && !encontrado; ++i){
                    if((termo == listaTI[i].termo)&&(i != index)) encontrado = true;
                }
                return encontrado;
            }
            catch (error) {
                return (error)
            } 
        },

        // No ato de um desdobramento em 4ºs níveis, trata a herança das relações

        procHeranca: function (procRel, novaClasse){
            for(var i=0; i < procRel.length; i++){
                // Tratamento do invariante: se é Suplemento Para então cria-se um critério de Utilidade Administrativa
                if(procRel[i].relacao == "eSuplementoPara"){
                    this.adicionarCriterio(novaClasse.pca.justificacao, "CriterioJustificacaoUtilidadeAdministrativa", "Critério de Utilidade Administrativa", "", [procRel[i]], []);
                }
                // Tratamento do invariante: se é Suplemento De então cria-se um critério Legal com toda a legislação selecionada associada
                else if(procRel[i].relacao == "eSuplementoDe"){
                    this.adicionarCriterio(novaClasse.pca.justificacao, "CriterioJustificacaoLegal", "Critério Legal", "", [procRel[i]], this.classe.legislacao);
                }
                // Tratamento do invariante: se é Síntese De então cria-se um critério de Densidade Informacional
                else if(procRel[i].relacao == "eSinteseDe"){
                    this.adicionarCriterio(novaClasse.df.justificacao, "CriterioJustificacaoDensidadeInfo", "Critério de Densidade Informacional", "", [procRel[i]], []);
                }
                // Tratamento do invariante: se é Síntetizado Por então cria-se um critério de Densidade Informacional
                else if(procRel[i].relacao == "eSintetizadoPor"){
                    this.adicionarCriterio(novaClasse.df.justificacao, "CriterioJustificacaoDensidadeInfo", "Critério de Densidade Informacional", "", [procRel[i]], []);
                }
                // Tratamento do invariante: se é Complementar De então cria-se um critério de Complementaridade Informacional
                else if(procRel[i].relacao == "eComplementarDe"){
                    this.adicionarCriterio(novaClasse.df.justificacao, "CriterioJustificacaoComplementaridadeInfo", "Critério de Complementaridade Informacional", "", [procRel[i]], []);
                }
            }
            novaClasse.df.valor = this.calcDF(novaClasse.processosRelacionados);
        },


        validaTI: async function(ti, index, cindex) {
            try {
                // Vamos ver se já existe nesta classe
                if(await this.findTI(this.classe.subclasses[cindex].termosInd, ti.termo, index)) {
                    ti.existe = true
                }  
                else {
                    let response = await axios.get("/api/termosIndice?existe=" + ti.termo)
                    ti.existe = response.data
                }
                return ti.existe
            } 
            catch (error) {
                return (error)
            }    
        },

        insereNovaNota: function(notas, tipo){
            axios.get("/api/utils/id")
                .then(function(response){
                    var n = {id: tipo + '_' + response.data, conteudo: ''};
                    notas.push(n);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },

        insereNovoTI: function(termos){
            axios.get("/api/utils/id")
                .then(function(response){
                    var n = {id: 'ti_' + response.data, termo: '', existe: false};
                    termos.push(n);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },

        calcDF: function(listaProc){
            var res = "NE";

            var complementar = listaProc.findIndex(p => p.relacao == 'eComplementarDe');
            if(complementar != -1){
                res = "C";
            }
            else{
                var sinteseDe = listaProc.findIndex(p => p.relacao == 'eSinteseDe');
                if(sinteseDe != -1){
                    res = "C";
                }
                else{
                    var sintetizado = listaProc.findIndex(p => p.relacao == 'eSintetizadoPor');
                    if(sintetizado != -1){
                        res = "E";
                    }
                    else{
                        res = "NE";
                    }
                }
            }
            return res;
        },

        calcSinteseDF4Nivel: function(){
            if(this.classe.subdivisao4Nivel01Sintetiza02){
                this.classe.subclasses[0].processosRelacionados.push(
                    {
                        codigo: this.classe.subclasses[1].codigo,
                        titulo: this.classe.subclasses[1].titulo,
                        relacao: 'eSinteseDe',
                        relLabel: 'é Síntese de'
                    }
                );
                this.classe.subclasses[1].processosRelacionados.push(
                    {
                        codigo: this.classe.subclasses[0].codigo,
                        titulo: this.classe.subclasses[0].titulo,
                        relacao: 'eSintetizadoPor',
                        relLabel: 'é Sintetizado por'
                    }
                );
            }
            else{
                this.classe.subclasses[0].processosRelacionados.push(
                    {
                        codigo: this.classe.subclasses[1].codigo,
                        titulo: this.classe.subclasses[1].titulo,
                        relacao: 'eSintetizadoPor',
                        relLabel: 'é Sintetizado por'
                    }
                );
                this.classe.subclasses[1].processosRelacionados.push(
                    {
                        codigo: this.classe.subclasses[0].codigo,
                        titulo: this.classe.subclasses[0].titulo,
                        relacao: 'eSinteseDe',
                        relLabel: 'é Síntese de'
                    }
                );
            }
        },

        remSintese4Nivel: function(subclasses){
            var index = -1;
            for(var i=0; i < subclasses.length; i++){
                if(subclasses[i].processosRelacionados.length > 0){
                    index = subclasses[i].processosRelacionados.findIndex(p => (p.relacao == 'eSintetizadoPor')||(p.relacao == 'eSinteseDe'));
                    if(index != -1) 
                        subclasses[i].processosRelacionados.splice(index,1);
                }
            }
        },

        tabClicked: function (event) {
            this.activeTab = event;
        },

        showMsg(text) {
            this.modalMsg = text;
            this.modalMsgShow = true;
        },
        
        // Vai adicionar a nova classe/processo à lista de pedidos

        criarClasse: function () {
            alert("Neste momento, ainda não está pronta. A classe seria criada com a informação: " + JSON.stringify(this.classe))
            alert("Subclasses: " + JSON.stringify(this.classe.subclasses))
        }
    }
})