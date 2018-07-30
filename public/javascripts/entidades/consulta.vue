var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",
        type: "",

        entName: "",

        entInitials: "",
        content: [],

        domain: [],
        domainReady: false,

        participations: [],
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

        myTipolList: [],

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

                    this.domainReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipations: function () {
            var partsToParse = [];
            var keys = ['id', 'Title', 'Code'];

            this.$http.get("/api/entidades/" + this.id + "/participacoes")
                .then(function (response) {
                    partsToParse = response.body;
                })
                .then(function () {
                    this.participations = this.parseParticipants(partsToParse, keys);
                    this.newParticipations = JSON.parse(JSON.stringify(this.participations));

                    this.partsReady = true;
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
                    this.myTipolList = this.parseList(dataToParse, keys);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parse: function (content) {
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

            var types = Object.keys(dest);

            for (var i = 0; i < types.length; i++) {
                dest[types[i]] = dest[types[i]].sort(function (a, b) {
                    return a.id.localeCompare(b.id);
                });
            }

            return dest;
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