var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",

        tipologia: "",

        donoProcessos: [],
        eDonoProcessos: false,
        domainCollapsed: true,

        participantePNs: [],
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

        elementos: [],
        elemsReady: false
    },
    methods: {
        processosDono: function () {

            this.$http.get("/api/tipologias/" + this.id+"/intervencao/dono")
                .then(function (response) {
                    this.donoProcessos = response.body;
                    if(this.donoProcessos.length > 0) this.eDonoProcessos = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipantes: function () {
            var participa = false;
            var tipoPar = "";

            this.$http.get("/api/tipologias/" + this.id + "/intervencao/participante")
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
        loadElementos: function () {
            
            this.$http.get("/api/tipologias/" + this.id + "/elementos")
                .then(function (response) {
                    this.elementos = response.body;
                    this.elemsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
    },
    created: function () {
        this.id = window.location.pathname.split('/')[2];
        
        this.$http.get("/api/tipologias/" + this.id)
            .then(function (response) {
                this.tipologia = response.body;
            })
            .then(function () {
                this.processosDono();
                this.loadParticipantes();
                this.loadElementos();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})