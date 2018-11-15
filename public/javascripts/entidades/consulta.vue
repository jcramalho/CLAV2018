var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",
        myEntidade: {},

        listaTipologias: [],
        tipologiasReady: false,

        donoProcessos: [],
        eDonoProcessos: false,

        participantePNs:[],
        partsReady: false,

        participations: {
                Apreciador: [],
                Assessor: [],
                Comunicador: [],
                Decisor: [],
                Executor: [],
                Iniciador: [],
            },
        participationsDic: {
            Apreciador: "Apreciar",
            Assessor: "Assessorar",
            Comunicador: "Comunicar",
            Decisor: "Decidir",
            Executor: "Executar",
            Iniciador: "Iniciar"
        },

        partsCollapsed: {
            Apreciador: true,
            Assessor: true,
            Comunicador: true,
            Decisor: true,
            Executor: true,
            Iniciador: true,
        },
        domainCollapsed: true
    },
    methods: {
        loadTipologias: function () {
            this.$http.get("/api/entidades/" + this.myEntidade.id + "/tipologias")
                .then(function (response) { 
                    this.listaTipologias = response.body;
                })
                .then(function () {
                    for (var i = 0; i < this.listaTipologias.length; i++) {
                        this.listaTipologias[i].id = this.listaTipologias[i].id.replace(/[^#]+#(.*)/, '$1');
                    }

                    if(this.listaTipologias.length>0) this.tipologiasReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        processosDono: function () {

            this.$http.get("/api/entidades/" + this.myEntidade.id + "/intervencao/dono")
                .then(function (response) {
                    this.donoProcessos = response.body
                    if(this.donoProcessos.length > 0) this.eDonoProcessos = true
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipantes: function () {
            var participa = false;
            var tipoPar = "";

            this.$http.get("/api/entidades/" + this.myEntidade.id + "/intervencao/participante")
                .then(function (response) {
                    
                    this.participantePNs = response.body;
                    
                    for(var i=0; i < this.participantePNs.length; i++ ){
                        tipoPar = this.participantePNs[i].tipoPar.replace(/.*temParticipante(.*)/, '$1');

                        this.participations[tipoPar].push(
                                     { titulo: this.participantePNs[i].titulo,
                                       codigo: this.participantePNs[i].codigo 
                                       })
                        participa = true
                    }
                    if(participa) this.partsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
    },
    created: function () {
        // exemplo: "entidades/ent_CEE" fica com o id "ent_CEE"
        //var ident = window.location.pathname.split('/')[2];
        this.id = window.location.pathname.split('/')[2];

        this.$http.get("/api/entidades/" + this.id)
            .then(function (response) {
                this.myEntidade = response.body;
                this.myEntidade.id = this.id;
                console.log(this.myEntidade);
            })
            .then(function (){
                this.loadTipologias();
                this.processosDono();
                this.loadParticipantes();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})