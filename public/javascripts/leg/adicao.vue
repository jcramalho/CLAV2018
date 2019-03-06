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
        entidades: [],
        entidadesReady: false,
        orgsTableHeader: ["Sigla", "Designação"],
        orgsTableWidth: ["15%", "85%"],
        message: "",
        
        tipoDiploma: [],

        newProcesso: "",
        listaClasses: [],
        classesReady: false,
        newProcessos: [],

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

            for(var i = 0; i< this.entidades.length; i++){
                this.diploma.entidades[i] = this.entidades[i].id
            }
            for(var i = 0; i< this.newProcessos.length; i++){
                this.processos[i] = this.newProcessos[i].id
            }

            var formats= {
                numero: new RegExp(/[0-9]+(\-\w)?\/[0-9]\d{3}$/),
                data: new RegExp(/[0-9]+\/[0-9]+\/[0-9]+/)
            }

            var parseAno = this.diploma.numero.split("/");
            var anoDiploma = parseInt(parseAno[1]);

            if( anoDiploma<2000 ){
                formats.numero= new RegExp(/[0-9]+(\-\w)?\/[0-9]\d{1}$/)
            }

            for(let field in formats){
                if(!formats[field].test(this.diploma[field])){
                    if( anoDiploma<2000 ){
                        messageL.showMsg("Anos de diploma anteriores a 2000 devem ter apenas os dois últimos dígitos!");
                        return false;
                    }
                    messageL.showMsg("O campo " + field + " está no formato errado!");
                    return false;
                }
            }

            var date = new Date();

            var ano = parseInt(this.diploma.data.slice(0, 4));
            var mes = parseInt(this.diploma.data.slice(5, 7));
            var dia = parseInt(this.diploma.data.slice(8, 10));

            dias = [31,28,31,30,31,30,31,31,30,31,30,31]

            if( mes>12 ){
                messageL.showMsg("Mês inválido!")
                return false
            }
            if( dia > dias[mes-1]){
                if( ano % 4 == 0 && mes == 2 && dia == 29){}
                else{ 
                messageL.showMsg("Dia do mês inválido!")
                return false
                }
            }

            if( anoDiploma > parseInt(date.getFullYear()) ){
                messageL.showMsg("Ano de Diploma inválido!")
                return false
            }
            if( ano > parseInt(date.getFullYear()) ){
                messageL.showMsg("Ano inválido! Por favor selecione uma data anterior à atual");
                return false
            }
            if( ano == parseInt(date.getFullYear()) && mes > parseInt(date.getMonth() + 1) ){
                messageL.showMsg("Mês inválido! Por favor selecione uma data anterior à atual");
                return false
            }
            if( ano == parseInt(date.getFullYear()) && mes == parseInt(date.getMonth() + 1) && dia > parseInt(date.getDate()) ){
                messageL.showMsg("Dia inválido! Por favor selecione uma data anterior à atual");
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
        loadEntidades: function () {
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

                    this.entidadesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });       
        },
        selecionarEntidade: function (row) {
            this.entidades.push(row);
            row.selected = true;
        },
        desselecionarEntidade: function (row, index) {
            row.selected = false;
            this.entidades.splice(index, 1);
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
                                data: [item.codigo +" - "+ item.titulo],
                                selected: false,
                                id: item.codigo
                            }
                        }).sort(function (a, b) {
                            return a.data[0].localeCompare(b.data[0]);
                        });
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        selecionarProcesso: function (row) {
            this.newProcessos.push(row);
            row.selected = true;
        },
        desselecionarProcesso: function (row, index) {
            row.selected = false;
            this.newProcessos.splice(index, 1);
        },
        /*addProcesso: function(){
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
        },*/
    },
    created: function () {
        this.loadEntidades();
        this.loadTipoDiploma(); 
        this.loadClasses();
    }
})