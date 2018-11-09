var org = new Vue({
    el: '#organizacao-form',
    data: {
        myEntidade: {},

        listaTipologias: [],

        id: "",
        type: "",

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
        loadTipologias: function () {
            var dataToParse = [];
            
            this.$http.get("/api/entidades/" + this.myEntidade.id + "/tipologias")
                .then(function (response) { 
                    this.listaTipologias = response.body;
                })
                .then(function () {
                    // id da tipologia
                    for (var i = 0; i < this.listaTipologias.length; i++) {
                        this.listaTipologias[i].id = this.listaTipologias[i].id.replace(/[^#]+#(.*)/, '$1');
                    }

                    if(this.listaTipologias.length>0)
                        this.tipologiasReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadDono: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/entidades/" + this.id + "/intervencao/dono")
                .then(function (response) {
                    classesToParse = response.body;
                    console.log(response.body)
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
        loadEntRels: function() {
            this.entRelsReady = false;
        },
    },
    created: function () {
        // exemplo: "entidades/ent_CEE" fica com o id "ent_CEE"
        var ident = window.location.pathname.split('/')[2];
        
        this.$http.get("/api/entidades/" + ident)
            .then(function (response) {
                this.myEntidade = response.body;
                this.myEntidade.id = window.location.pathname.split('/')[2];
            })
            .then(function (){
                this.loadTipologias();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})