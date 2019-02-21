var tip = new Vue({
    el: '#editTipologia-form',
    data: {
        id: "",

        tipNome: "",
        newNome: "",
        tipSigla: "",

        editNome: false,

        editSigla: false,
        newSigla: "",

        editDominio: false,
        newDominio: [],
        dominio: [],
        newClasse: "",
        listaClasses: [],
        dominioReady: false,
        domainCollapsed: true,

        editParts: false,
        participacoes: [],
        newParticipacoes: [],
        participacoesDic: {
            Apreciador: "Apreciar",
            Assessor: "Assessorar",
            Comunicador: "Comunicar",
            Decisor: "Decidir",
            Executor: "Executar",
            Iniciador: "Iniciar"
        },
        newTipoPart: "",
        newPart: "",
        partsReady: false,
        partsCollapsed: {
            Apreciador: true,
            Assessor: true,
            Comunicador: true,
            Decisor: true,
            Executor: true,
            Iniciador: true,
        },

        editEnts: false,
        newEntsList: [],
        listaEntidades: [],
        entList: [],
        newElem: "",

        delConfirm: false,
    },
    components: {
        spinner: VueStrap.spinner,
        modal: VueStrap.modal,
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
    methods: {
        subtractArray: function (from, minus) {
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
        loadDominio: function () {
            var classes = [];

            this.$http.get("/api/tipologias/" + this.id+"/intervencao/dono")
                .then(function (response) {
                    classes = response.body;
                })
                .then(function () {
                    this.dominio = JSON.parse(JSON.stringify(classes));
                    this.newDominio = JSON.parse(JSON.stringify(classes));

                    this.dominioReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadClasses: function () {
            var classes = [];

            this.$http.get("/api/classes?nivel=3")
                .then(function (response) {
                    classes = response.body;
                })
                .then(function () {
                    this.listaClasses = classes
                        .map(function (item) {
                        return {
                            label: item.codigo + " - " + item.titulo,
                            value: item,
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        addClasse: function(){
            var existeClasse = 0;
            for(var i=0; i<this.newDominio.length; i++){
                if("c" + this.newClasse.value.codigo== "c" + this.newDominio[i].codigo){
                    existeClasse = 1;
                    break
                }
            }
            if(existeClasse==0){
                this.newDominio.unshift(this.newClasse.value)
            }
            else{
                messageL.showMsg("Essa Classe já se encontra selecionada!");
            }
        },
        loadParticipacoes: function () {
            var partsToParse = [];
            var keys = ['id', 'titulo', 'codigo'];

            this.$http.get("/api/tipologias/" + this.id + "/intervencao/participante")
                .then(function (response) {
                    partsToParse = response.body;
                })
                .then(function () {
                    this.participacoes = this.parseParticipants(partsToParse, keys);
                    this.newParticipacoes = JSON.parse(JSON.stringify(this.participacoes));

                    this.partsReady = true;
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

                    temp[keys[j]] = content[i][keys[j]];

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }
                var type = content[i].tipoPar.replace(/.*temParticipante(.*)/, '$1');

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
        addPart: function(){
            var existePart = 0;
            for(var i=0; i<this.newParticipacoes[this.newTipoPart.value].length; i++){
                if(this.newPart.value.codigo==this.newParticipacoes[this.newTipoPart.value][i].codigo) {
                    existePart = 1;
                    break;
                }
            }
            if(existePart==0){
                this.newParticipacoes[this.newTipoPart.value].unshift(this.newPart.value)
            }
            else{
                messageL.showMsg("Já selecionou essa classe como " + this.newTipoPart.value + "!");
            }
        },
        loadEnts: function () {

            this.$http.get("/api/tipologias/" + this.id + "/elementos")
                .then(function (response) {
                    this.listaEntidades = response.body;
                })
                .then(function () {
                    this.newEntsList = JSON.parse(JSON.stringify(this.listaEntidades));
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadEntList: function () {
            var dataToParse = [];

            this.$http.get("/api/entidades")
                .then(function (response) {
                    dataToParse = response.body;
                })
                .then(function () {
                    var completeList = dataToParse;

                    this.entList = completeList.map(function (item) {
                        return {
                            label: item.sigla +"-"+ item.designacao,
                            value: item,
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });


                    //this.elemsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        addEntidade: function (){
            var existeEnt = 0;
            for(var i=0; i<this.newEntsList.length; i++){
                if(this.newElem.value.id==this.newEntsList[i].id) {
                    existeEnt = 1;
                    break;
                }
            }
            if(existeEnt==0){
                this.newEntsList.unshift(this.newElem.value)
            }
            else{
                messageL.showMsg("Já selecionou essa Entidade!");
            }
        },
        update: function () {
            this.$refs.spinner.show(); 

            var dataObj = {
                id: this.id,
                nome: null,
                sigla:null,
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
                ents: {
                    add: null,
                    del: null,
                },
            }

            if (this.editNome) {
                dataObj.nome = this.newNome;
            }
            if (this.editSigla) {
                dataObj.sigla = this.newSigla;
            }
            if (this.editDominio) {

                var temp = {
                    add: null,
                    delete: null,
                };

                temp.add = this.subtractArray(this.newDominio, this.dominio);
                temp.del = this.subtractArray(this.dominio, this.newDominio);

                dataObj.dominio = JSON.parse(JSON.stringify(temp));
            }
            if (this.editParts) {
                for (const pType in this.participacoes) {

                    var temp = {
                        add: null,
                        del: null,
                    };

                    temp.add = this.subtractArray(this.newParticipacoes[pType], this.participacoes[pType]);
                    temp.del = this.subtractArray(this.participacoes[pType], this.newParticipacoes[pType]);

                    dataObj.parts[pType] = JSON.parse(JSON.stringify(temp));
                }
            }
            if (this.editEnts) {
                var temp = {
                    add: null,
                    delete: null,
                };

                temp.add = this.subtractArray(this.newEntsList, this.listaEntidades);
                temp.del = this.subtractArray(this.listaEntidades, this.newEntsList);

                dataObj.ents = JSON.parse(JSON.stringify(temp));
            }

            console.log(dataObj)

            this.$http.put('/api/tipologias/'+this.id, dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response){
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
        deleteTipologia: function () {
            this.$refs.spinner.show();
            
            this.$http.delete('/api/tipologias/'+this.id)
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
        }
    },
    created: function () {
        this.id = window.location.pathname.split('/')[3];
        
        this.$http.get("/api/tipologias/" + this.id)
            .then(function (response) {
                this.tipNome = response.body.designacao;
                this.tipSigla = response.body.sigla;
            })
            .then(function () {
                this.loadDominio();
                this.loadClasses();
                this.loadParticipacoes();
                this.loadEnts();
                this.loadEntList();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})