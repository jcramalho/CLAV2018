var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",

        myEntidade: [],

        editDes: false,
        newDes: "",
        entDes: "",

        editSigla: false,
        newSigla: "",

        editInternacional: false,
        newInternacional: "",

        editSIOE: false,
        newSIOE: "",

        editEstado: false,
        newEstado: "",

        listaTipologias: [],
        newListaTipologias: [],

        dominio: [],

        editTipologia: false,
        tipoListaCompleta: [],

        editDono: false,
        novoDono: [],

        donoProcessos: [],
        eDonoProcessos: false,
        domainCollapsed: true,

        listaClasses: [],
        novaClasse: "",
        classesReady: false,

        partsReady: false,
        novoTipoPart: "",
        novaPart: "",
        newParticipations: [],

        participacoes: {
            Apreciador: [],
            Assessor: [],
            Comunicador: [],
            Decisor: [],
            Executor: [],
            Iniciador: [],
        },
        participacoesDic: {
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

        delConfirm: false,

        tipologiasSelecionadas: [],
        tipsTableHeader: ["Sigla", "Designação"],
        tipsTableWidth: ["15%", "85%"],
    },
    computed: {
        partOptions: function(){
            var dictionary = this.participacoesDic;
            return Object.keys(this.participacoes).map(
                function(a){
                    return{
                        label: dictionary[a],
                        value: a
                    }
                }
            )
            
        }
    },
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
                    //this.newListaTipologias = JSON.parse(JSON.stringify(this.listaTipologias));
                    this.tipolsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
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
        loadTipoListaCompleta: function(){
            this.$http.get("/api/tipologias")
                .then(function (response) {
                    listaCompleta = response.body;
                })
                .then(function () {
                    this.tipoListaCompleta = listaCompleta.map(function (item) {
                        return {
                            data: [item.sigla, item.designacao],
                            selected: false,
                            id: item.id
                        }
                    }).sort(function (a, b) {
                        return a.data[1].localeCompare(b.data[1]);
                    });
                    for(var i = 0; i<this.listaTipologias.length; i++){
                        for(var j = 0; j<this.tipoListaCompleta.length; j++){
                            if(this.listaTipologias[i].sigla === this.tipoListaCompleta[j].data[0]){
                                this.tipoListaCompleta[j].selected = true;
                                this.tipologiasSelecionadas[i] = this.tipoListaCompleta[j];
                            }
                        }
                    }
                    this.tipolsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        selecionarTipologia: function (row) {
            this.tipologiasSelecionadas.push(row);
            row.selected = true;
        },
        desselecionarTipologia: function (row, index) {
            row.selected = false;
            this.tipologiasSelecionadas.splice(index, 1);
        },
        processosDono: function () {
            this.$http.get("/api/entidades/" + this.id + "/intervencao/dono")
                .then(function (response) {
                    this.donoProcessos = response.body
                    this.novoDono = JSON.parse(JSON.stringify(this.donoProcessos));

                    if(this.donoProcessos.length > 0) this.eDonoProcessos = true
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        addDono: function (){
            var existeDono = 0;
            for(var i=0; i<this.novoDono.length; i++){
                if(this.novaClasse.codigo==this.novoDono[i].codigo){
                    existeDono = 1;
                    break;
                }
            }
            if(existeDono==0){
                this.novoDono.unshift(this.novaClasse);
            }
            else{
                messageL.showMsg("Já selecionou essa classe como Dono!");
            }
        },
        loadParticipantes: function () {
            var tipoPar = "";

            this.$http.get("/api/entidades/" + this.id + "/intervencao/participante")
                .then(function (response) {
                    
                    this.participantePNs = response.body;
                    for(var i=0; i < this.participantePNs.length; i++ ){
                        tipoPar = this.participantePNs[i].tipoPar.replace(/.*temParticipante(.*)/, '$1');

                        this.participacoes[tipoPar].push(
                                     { titulo: this.participantePNs[i].titulo,
                                       codigo: this.participantePNs[i].codigo ,
                                       label: this.participantePNs[i].codigo + ' - ' + this.participantePNs[i].titulo
                                       })
                    }
                    this.newParticipations = JSON.parse(JSON.stringify(this.participacoes));
                    this.partsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        addPart: function(){
            var existePart = 0;
            for(var i=0; i<this.newParticipations[this.novoTipoPart.value].length; i++){
                if(this.novaPart.codigo==this.newParticipations[this.novoTipoPart.value][i].codigo) {
                    existePart = 1;
                    break;
                }
            }
            if(existePart==0){
                this.newParticipations[this.novoTipoPart.value].unshift(this.novaPart)
            }
            else{
                messageL.showMsg("Já selecionou essa classe como " + this.novoTipoPart.value + "!");
            }
            
        },
        loadClasses: function () {
            var classesToProcess = []

            this.$http.get("/api/classes?nivel=3")
                .then(function (response) {
                    classesToProcess = response.body;

                    var i, c
                    for( i=0; i < classesToProcess.length; i++){ 
                        c = classesToProcess[i]
                        var myClasse = {codigo: c.codigo, titulo: c.titulo, label: c.codigo + ' - ' + c.titulo }
                        this.listaClasses.push(myClasse)
                    }
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        //funcao de update
        update: function() {
            var numeroSIOE = new RegExp(/[0-9]+(\-\w)?/);

            if(!numeroSIOE.test(this.newSIOE) && this.newSIOE!=""){
                messageL.showMsg("Campo SIOE está no formato errado. Apenas são aceites caracteres numéricos.");
                return false;
            }

            for(var i = 0; i< this.tipologiasSelecionadas.length; i++){
                this.newListaTipologias[i] = this.tipologiasSelecionadas[i].id
            }

            this.$refs.spinner.show(); 

            var dataObj = {
                des: null,
                sigla: null,
                internacional: null,
                sioe: null,
                estado: null,
                codigo: "ent_" + this.myEntidade.sigla,
                dominio: {
                    add: null,
                    del: null,
                },
                parts: {
                    Apreciador: {
                        add: null,
                        del: null,
                    },
                    Assessor: {
                        add: null,
                        del: null,
                    },
                    Comunicador: {
                        add: null,
                        del: null,
                    },
                    Decisor: {
                        add: null,
                        del: null,
                    },
                    Executor: {
                        add: null,
                        del: null,
                    },
                    Iniciador: {
                        add: null,
                        del: null,
                    },
                },
                tipols: {
                    add: null,
                    del: null,
                },
            }
            if(this.editDes) {
                dataObj.des = this.newDes;
            }
            if (this.editSigla) {
                dataObj.sigla = this.newSigla;
                dataObj.codigo = "ent_" + dataObj.sigla;
            }
            if(this.editInternacional){
                dataObj.internacional = this.newInternacional;
            }
            if(this.editSIOE){
                dataObj.sioe = this.newSIOE;
            }
            if(this.editEstado){
                dataObj.estado = this.newEstado;
            }
            if(this.editTipologia){
                var temp = {
                    add: null,
                    delete: null,
                };

                temp.add = this.subtractArray(this.newListaTipologias, this.listaTipologias);
                temp.del = this.subtractArray(this.listaTipologias, this.newListaTipologias);

                dataObj.tipols = JSON.parse(JSON.stringify(temp));
            }
            if (this.editDono) {
                var temp = {
                    add: null,
                    delete: null,
                };

                temp.add = this.subtractArray(this.novoDono, this.dominio);
                temp.del = this.subtractArray(this.dominio, this.novoDono);

                dataObj.dominio = JSON.parse(JSON.stringify(temp));
            }
            if (this.editParts) {
                for (const pType in this.participacoes) {
                    var temp = {
                        add: null,
                        del: null,
                    };

                    temp.add = this.subtractArray(this.newParticipations[pType], this.participacoes[pType]);
                    temp.del = this.subtractArray(this.participacoes[pType], this.newParticipations[pType]);

                    console.log(this.newParticipations[pType])
                    console.log(temp.del)

                    dataObj.parts[pType] = JSON.parse(JSON.stringify(temp));
                }
            }

            
            console.log(dataObj);
            this.$http.put('/api/entidades/'+this.id, dataObj, {
                    headers: {
                        'content-type': 'application/json'
                    }
            })
                .then(function (){
                    this.$refs.spinner.hide();

                    window.location.href = '/pedidos/submissao';

                })
                .catch(error => {if (error.status === 409) {
                    messageL.showMsg(error.body);
                    this.$refs.spinner.hide();
                } 
                console.error(error);
                });
        },
        deleteEntidade: function () {
            this.$refs.spinner.show();

            this.$http.delete('/api/entidades/'+this.id)
                .then( function(response) { 
                    this.$refs.spinner.hide();
                    
                    window.location.href = '/pedidos/submissao';
                })
                .catch(error => {if (error.status === 409) {
                    messageL.showMsg(error.body);
                    this.$refs.spinner.hide();
                } 
                console.error(error);
                });
        },
    },
    created: function() {
        this.id = window.location.pathname.split('/')[3];
        
        this.$http.get("/api/entidades/" + this.id)
            .then(function (response) {
                this.myEntidade = response.body;
            })
            .then(function () {
                this.loadTipologias();
                this.loadTipoListaCompleta();
                this.processosDono();
                this.loadParticipantes();
                this.loadClasses();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})