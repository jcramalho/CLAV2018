var newLeg = new Vue({
    el: '#nova-legislacao-form',
    data: {
        diploma : {
            sumario: "",
            tipo: "",
            numero: "",
            data: "",
            link: "",
            entidades: [],
            
        },
        processos: [],
        
        orgs: [],
        orgsReady: false,
        orgsTableHeader: ["Sigla", "Nome"],
        orgsTableWidth: ["15%", "85%"],
        message: "",
        
        tipoDiploma: [],

        newProcesso: "",
        listaClasses: [],
        //newProcessos: [],

    },
    components: {
        spinner: VueStrap.spinner,
        datepicker: VueStrap.datepicker,
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
        modal: VueStrap.modal,
    },
    methods: {
        dataEscolhida: function(payload){
            this.diploma.data=""+payload;
        },
        readyToCreate: function(){
            for(let field in this.diploma){
                if(this.diploma[field].length==0  && field!="entidades"  && field!="link") return false;   
            }
            return true;
        },
        add: function(){
            this.message="";

            var formats= {
                numero: new RegExp(/[0-9]+(\-\w)?\/[0-9]\d{3}$/),
                data: new RegExp(/[0-9]+\/[0-9]+\/[0-9]+/)
            }

            for(let field in formats){
                if(!formats[field].test(this.diploma[field])){
                    messageL.showMsg("O campo " + field + " está no formato errado!");
                    return false;
                }
            }

            var parseAno = this.diploma.numero.split("/");
            var anoDiploma = parseInt(parseAno[1]);

            var date = new Date();

            var ano = parseInt(this.diploma.data.slice(0, 4));
            var mes = parseInt(this.diploma.data.slice(5, 7));
            var dia = parseInt(this.diploma.data.slice(8, 10));

            if( anoDiploma > parseInt(date.getFullYear()) ){
                messageL.showMsg("Ano de Diploma errado!")
                return false
            }
            if( ano > parseInt(date.getFullYear()) ){
                messageL.showMsg("Data errada! Por favor selecione uma data anterior à atual");
                return false
            }
            else if( mes > parseInt(date.getMonth() + 1) ){
                messageL.showMsg("Data errada! Por favor selecione uma data anterior à atual");
                return false
            }
            else if( dia > parseInt(date.getDate()) ){
                messageL.showMsg("Data errada! Por favor selecione uma data anterior à atual");
                return false
            }


            let Link = new RegExp(/https?:\/\/.+/);

            if(!Link.test(this.diploma.link) && this.diploma.link!=""){
                this.diploma.link = "http://"+this.diploma.link;
            }

            this.$refs.spinner.show();
            var dataObj = JSON.parse(JSON.stringify(this.diploma));  

            console.log(dataObj)

            this.$http.post('/api/legislacao/', dataObj,{
                headers: {
                    'content-type' : 'application/json'
                }
            })
                .then( function(response) { 
                    this.$refs.spinner.hide();

                    window.location.href = '/pedidos/submissao';
                       
                })
                .catch( error => {if (error.status === 409 ){
                    messageL.showMsg(error.body);
                    this.$refs.spinner.hide();
                }  
                    console.error(error); 
                });
        },
        loadOrgs: function () {
            this.$http.get("/api/entidades")
                .then(function (response) {
                    this.orgs = response.body
                        .map(function (item) {
                            return {
                                data: [item.sigla, item.designacao],
                                selected: false,
                                id: item.id
                            }
                        }).sort(function (a, b) {
                            return a.data[1].localeCompare(b.data[1]);
                        });

                    this.orgsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });       
        },
        orgSelected: function (row, list, partType) {
            if (!row.selected) {
                list.push(row.id);
            }
            else {
                let index = list.indexOf(row.id);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
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
            for(var i=0; i<this.processos.length; i++){
                if(this.newProcesso.value.codigo==this.processos[i].codigo){
                    existeProcesso = 1;
                    break
                }
            }
            if(existeProcesso==0){
                this.processos.unshift(this.newProcesso.value)
            }   
            else{
                messageL.showMsg("Esse processo já se encontra selecionado!");
            }
        },
    },
    created: function () {
        this.loadOrgs();
        this.loadTipoDiploma(); 
        this.loadClasses();
    }
})