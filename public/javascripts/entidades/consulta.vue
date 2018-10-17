var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",
        type: "",

        entName: "",

        entInitials: "",
        entEstado: "Ativa",
        entInternational: "",
        content: [],

        domain: [],
        domainReady: false,

        participations: {
                Apreciador: [],
                Assessor: [],
                Comunicador: [],
                Decisor: [],
                Executor: [],
                Iniciador: [],
            },
        partsReady: false,


        partsCollapsed: {
            Apreciador: true,
            Assessor: true,
            Comunicador: true,
            Decisor: true,
            Executor: true,
            Iniciador: true,
        },
        domainCollapsed: true,

        tipologiasList: [],
        tipologiasReady: false,

        entRelsList: [],
        entRelsReady: false,

        participationsDic: {
            Apreciador: "Apreciar",
            Assessor: "Assessorar",
            Comunicador: "Comunicar",
            Decisor: "Decidir",
            Executor: "Executar",
            Iniciador: "Iniciar"
        }

    },
    methods: {
        loadDomain: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/entidades/" + this.id+"/dominio")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.domain = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));
                    this.newDomain = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));

                    if(this.domain.length>0)
                        this.domainReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipations: function () {
            var type = ""
            var participa = false

            this.$http.get("/api/entidades/" + this.id + "/participacoes")
                .then(function (response) {
                    var partsToParse = response.body;
                
                    for(var i=0; i < partsToParse.length; i++ ){
                        type = partsToParse[i].Type.value.replace(/.*temParticipante(.*)/, '$1')
                        this.participations[type].push(
                                     { id: partsToParse[i].id.value.replace(/[^#]+#(.*)/, '$1'),
                                       Type: partsToParse[i].Type.value,
                                       Title: partsToParse[i].Title.value,
                                       Code: partsToParse[i].Code.value })
                        
                        participa = true
                    }

                    if(participa) this.partsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadTipols: function () {
            var dataToParse = [];
            var keys = ["id", "Designacao", "Sigla"];

            this.$http.get("/api/entidades/" + this.id + "/tipologias")
                .then(function (response) {
                    dataToParse = response.body;
                })
                .then(function () {
                    this.tipologiasList = this.parseList(dataToParse, keys);

                    if(this.tipologiasList.length>0)
                        this.tipologiasReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadEntRels: function() {
            this.entRelsReady = false;
        },
        parse: function (content) {
            this.entEstado = content[0].Estado.value
            this.entName = content[0].Designacao.value;
            this.newName = content[0].Designacao.value;
            this.entInitials = content[0].Sigla.value;
            this.entInternational = content[0].Internacional.value;
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
                }

                dest[i] = JSON.parse(JSON.stringify(temp));
            }

            return dest.sort(function (a, b) {
                return a.id.localeCompare(b.id);
            });
        },
    },
    created: function () {
        this.id = window.location.pathname.split('/')[3];
        
        this.$http.get("/api/entidades/" + this.id)
            .then(function (response) {
                this.parse(response.body);
            })
            .then(function () {
                this.loadDomain();
                this.loadParticipations();
                this.loadTipols();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})