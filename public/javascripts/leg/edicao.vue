var leg = new Vue({
    el: '#legislacao-form',
    data: {
        id: "",
        leg: [],
        legData: {
            data: {
                label: "Data",
                original: "",
                new: "",
                edit: false
            },
            numero: {
                label: "Número",
                original: "",
                new: "",
                edit: false
            },
            tipo: {
                label: "Tipo",
                original: "",
                new: "",
                edit: false
            },
            sumario: {
                label: "Sumario",
                original: "",
                new: "",
                edit: false
            },
            link: {
                label: "Link",
                original: "",
                new: "",
                edit: false
            },
            entidades: {
                original: [],
                new: [],
                edit: false
            },
            processos: {
                original: [],
                new: [],
                edit: false
            }
        },
        ready: false, 

        tipoDiploma: [],

        entidadesReady: false,
        entidades: [],
        newEntidade: "",

        processosReady: false,
        //processos:[],
        //newProcessos: [],
        processosCollapsed: true,
        //editProcessos:false,
        newProcesso: "",
        
        listaClasses:[],

        delConfirm:false,
    },
    components: {
        datepicker: VueStrap.datepicker,
        spinner: VueStrap.spinner,
        modal: VueStrap.modal,
    },
    methods: {
        parse: function(){
            this.legData.data.original=this.leg.data;
            this.legData.numero.original=this.leg.numero;
            this.legData.tipo.original=this.leg.tipo;
            this.legData.sumario.original=this.leg.sumario;
            this.legData.link.original=this.leg.link;

            let ent= this.leg.entidades;

            if(ent.length>0){
                this.legData.entidades.original = ent
            }

            this.legData.entidades.new = this.legData.entidades.original
            this.ready = true;
        },
        loadTipoDiploma: function () {
            this.$http.get("/api/vocabularios/vc_tipoDiplomaLegislativo")
                .then(function (response) {
                    this.tipoDiploma = response.body
                        .map(function (item) {
                            return {
                                termo: item.termo
                            }
                        }).sort(function (a, b) {
                            return a.termo.localeCompare(b.termo);
                        });
                })
                .catch(function (error) {
                    console.error(error);
                }); 
        },
        dataEscolhida: function(payload){
                this.legData.data.new= ""+payload;
        },
        loadEntidades: function () {
            var entidadesToParse = [];

            this.$http.get("/api/entidades")
                .then(function(response){
                    entidadesToParse = response.body;
                })
                .then(function () {
                    this.entidades = entidadesToParse
                        .map(function (item) {
                            return {
                                label: item.sigla + " - " + item.designacao,
                                value:item,
                            }
                        }).sort(function (a, b) {
                            return a.label.localeCompare(b.label);
                        });
                    this.entidadesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        addEntidade: function(){
            var existeEntidade = 0;
            for(var i=0; i<this.legData.entidades.new.length; i++){
                if(this.newEntidade.value.id=="ent_" + this.legData.entidades.new[i]){
                    existeEntidade = 1;
                    break
                }
            }
            if(existeEntidade==0){
                this.legData.entidades.new.unshift(this.newEntidade.value.sigla)
            }
            else{
                messageL.showMsg("Essa Entidade já se encontra selecionada!");
            }
        },
        loadProcessos: function () {
            var processosToParse = [];

            this.$http.get("/api/legislacao/" + this.id+"/regula")
                .then(function (response) {
                    processosToParse = response.body;
                })
                .then(function () {
                    this.legData.processos.original = JSON.parse(JSON.stringify(processosToParse));
                    this.legData.processos.new = JSON.parse(JSON.stringify(processosToParse));
                    this.processosReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadClasses: function () {
            var classesToParse = [];

            this.$http.get("/api/classes?nivel=3")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.listaClasses = classesToParse
                        .map(function(item){
                            return {
                                label: item.codigo +" - "+ item.titulo,
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
        addProcesso: function(){
            var existeProcesso = 0;
            for(var i=0; i<this.legData.processos.new.length; i++){
                if(this.newProcesso.value.codigo==this.legData.processos.new[i].codigo){
                    existeProcesso = 1;
                    break
                }
            }
            if(existeProcesso==0){
                this.legData.processos.new.unshift(this.newProcesso.value)
            }
            else{
                messageL.showMsg("Esse processo já se encontra selecionado!");
            }
        },
        update: function(){
            this.$refs.spinner.show();

            var formats= {
                numero: new RegExp(/[0-9]+(\-\w)?\/[0-9]\d{3}$/),
                data: new RegExp(/[0-9]+\/[0-9]+\/[0-9]+/)
            }

            if(!formats.numero.test(this.legData.numero.new) && this.legData.numero.new!=""){
                messageL.showMsg("O campo número está no formato errado!");
                return false;
            }
            if(!formats.data.test(this.legData.data.new) && this.legData.data.new!=""){
                messageL.showMsg("O campo data está no formato errado!");
                return false;
            }

            let Link = new RegExp(/https?:\/\/.+/);

            if(!Link.test(this.legData.link.new) && this.legData.link.new!=""){
                this.legData.link.new = "http://"+this.legData.link.new;
            }
            this.$refs.spinner.hide();

            
            var dataObj = {
                id: this.id,
                data: null,
                numero: null,
                tipo: null,
                titulo: null,
                link: null,
                entidades: null,
            };

            keys=Object.keys(this.legData);

            for(var i=0;i<keys.length;i++){
                if(this.legData[keys[i]].edit && this.legData[keys[i]].new){
                    dataObj[keys[i]]=this.legData[keys[i]].new;
                }
            }

            console.log(dataObj);

            this.$http.put('/api/legislacao/'+this.id,dataObj,{
                headers: {
                    'content-type' : 'application/json'
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
        apagarLeg: function(){
            this.$refs.spinner.show();

            this.$http.delete('/api/legislacao/'+this.id)
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
    created: function() {
        this.id = window.location.pathname.split('/')[3];

        this.$http.get("/api/legislacao/"+this.id)
        .then( function(response) { 
            this.leg = response.body;
        })
        .then( function() {
            this.parse();
            this.loadTipoDiploma();
            this.loadEntidades();
            this.loadProcessos();
            this.loadClasses();
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})