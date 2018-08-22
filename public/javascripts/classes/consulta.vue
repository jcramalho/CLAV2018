var classe = new Vue({
    el: '#classe-form',
    data: {
        message: "",
        id: "",
        
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
        prepData: function (dataObj) {
            this.clas.Title = dataObj.Titulo.value;
            this.clas.Code = dataObj.Codigo.value;

            if (dataObj.Status) {
                this.clas.Status = dataObj.Status.value;
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
            }

            this.loadExAppNotes();
            this.loadAppNotes();
            this.loadDelNotes();
            this.loadIndexes();

            if (this.clas.Level >= 3) {

                if (dataObj.ProcTipo) {
                    this.clas.ProcType = dataObj.ProcTipo.value;
                }
                if (dataObj.ProcTrans) {
                    this.clas.ProcTrans = dataObj.ProcTrans.value;
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
        loadOwners: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla", "Designacao"];

            this.$http.get("/api/classes/" + this.id + "/donos")
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    this.clas.Owners = JSON.parse(JSON.stringify(this.parse(orgsToParse, keys)));

                    this.ownersReady = true;
                    this.loadParticipants();
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

                    this.legsReady = true;
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
                    console.log(this.clas.DelNotes);

                    this.clas.DelNotes = this.clas.DelNotes.map(
                        function(a){
                            a.Nota = a.Nota.replace(
                                /([0-9]{3}(\.?[0-9]+)*)/g,
                                '<a href="/classes/consultar/c$1">$1</a>'
                            )
                            return a;
                        }
                        
                    );
                    console.log(this.clas.DelNotes);

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

                    this.exAppNotesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
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

                    this.relProcsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
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

            this.$http.get("/api/classes/" + this.id + "/participantes")
                .then(function (response) {
                    participantsToParse = response.body;
                })
                .then(function () {
                    this.clas.Participants = this.parseParticipants(participantsToParse, keys);

                    this.participantsReady = true;
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