var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",

        myEntidade: [],

        editDes: false,
        newDes: "",
        entDes: "",

        editInternacional: false,
        newInternacional: "",

        listaTipologias: [],
        newListaTipologias: [],

        editTipologia: false,
        tipoListaCompleta: [],
        newTipologia:"",

        editDono: false,

        donoProcessos: [],
        eDonoProcessos: false,
        domainCollapsed: true,

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

        editParts:false,
    },
    //componentes necessários para o funcionamento do Vue
    components: {
        spinner: VueStrap.spinner,
        modal: VueStrap.modal,
    },
    methods: {
        loadTipologias: function () {

            this.$http.get("/api/entidades/" + this.id + "/tipologias")
                .then(function (response) {
                    this.listaTipologias = response.body;
                })
                .then(function () {
                    this.newListaTipologias = JSON.parse(JSON.stringify(this.listaTipologias));
                    this.tipolsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        ///Ver com o back end
        subtractArray: function(from, minus){
            var ret;
            if (!from) {
                ret = null;
            }
            else if (!minus) {
                ret = JSON.parse(JSON.stringify(from));
            }
            else {
                ret = from.filter(function (item) {
                    var r = true;
                    for (var i = 0; i < minus.length; i++) {
                        if (minus[i].id == item.id) {
                            r = false;
                            break;
                        }
                    }
                    return r;
                });
            }
            return ret;
        },
        //falta o back end das tipologias
        //loadTipoListaCompleta: function(){

        //}
        processosDono: function () {
            this.$http.get("/api/entidades/" + this.id + "/intervencao/dono")
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

            this.$http.get("/api/entidades/" + this.id + "/intervencao/participante")
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
                    this.newParticipations = JSON.parse(JSON.stringify(this.participations));
                    if(participa) this.partsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        //funcao de update
        update: function() {
            this.$refs.spinner.show(); 

            var dataObj = {
                des: null,
                internacional: null,
            }
            if(this.editDes) {
                dataObj.des = this.newDes;
            }
            if(this.editInternacional){
                dataObj.internacional = this.newInternacional;
            }
            if(this.editTipologia){
                var temp = {
                    add: null,
                    delete: null,
                };

                temp.add = this.subtractArray(this.newListaTipologias, this.listaTipologias);
                temp.del = this.subtractArray(this.listaTipologias, this.newListaTipologias);
            }
            if (this.editParts) {
                for (const pType in this.participations) {

                    var temp = {
                        add: null,
                        del: null,
                    };

                    temp.add = this.subtractArray(this.newParticipations[pType], this.participations[pType]);
                    temp.del = this.subtractArray(this.participations[pType], this.newParticipations[pType]);

                    dataObj.parts[pType] = JSON.parse(JSON.stringify(temp));
                }
            }
            //Realiza um put apos update
            ////////////////////////////
            this.$http.put('/api/entidades/'+this.id, dataObj, {
                    headers: {
                        'content-type': 'application/json'
                    }
                })
                .then(function (response){
                    this.$refs.spinner.hide();
                        
                    var resp = response.body;
                    if (resp != "Designação já existentente!") {
                        window.location.href = '/entidades/' + this.id;
                    } else {
                        messageL.showMsg(resp);
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
                //////////////////////////
        }
    },
    created: function() {
        this.id = window.location.pathname.split('/')[3];
        
        this.$http.get("/api/entidades/" + this.id)
            .then(function (response) {
                this.myEntidade = response.body;
            })
            .then(function () {
                this.loadTipologias();
                this.processosDono();
                this.loadParticipantes();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})