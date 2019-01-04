var newOrg = new Vue({
    el: '#nova-entidade-form',
    data: {
        tipologias: [],
        ready: false,

        designacao: "",
        sigla: "",
        sioe: "",
        internacional: "Não",
        message: "",
        tip: "",
        
        tipologiasSel: []
    },
    created: function(){
        //dá a lista de tipologias, para o utilizador adicionar a que tipologias pertence
        this.$http.get("/api/tipologias/")
            .then( function(response) { 
                this.tipologias = response.body;
            })
            .then( function(){
                this.tipologias.sort(this.dynamicSort("sigla"))
                this.ready=true
            })
            .catch( function(error) { 
                console.error(error); 
            });
    },
    components: {
        spinner: VueStrap.spinner,
        modal: VueStrap.modal,
         panel: VueStrap.panel,
    },
    methods: {
        dynamicSort: function(property) {
            var sortOrder = 1;
            if(property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a,b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        },
        findTip: function(tid){
            var i=0, encontrado = false
            while((i < this.tipologias.length)&&(!encontrado)){
                if(tid == this.tipologias[i].id) encontrado = true
                else i++
            }
            return encontrado?i:-1
        },
        addTip: function(){
            var ind = this.findTip(this.tip)
            var existe = 0;
            for(var i=0; i<this.tipologiasSel.length; i++){
                if(this.tip==this.tipologiasSel[i].id){
                    existe = 1;
                    break;
                }
            }
            if(existe==0){
            this.tipologiasSel.push(this.tipologias[ind])
            }
            else{
                messageL.showMsg("Já selecionou essa tipologia!");
            }
        },
        add: function () {
            this.$refs.spinner.show();

            this.message="";

            var numeroSIOE = new RegExp(/[0-9]+(\-\w)?/);

            if(!numeroSIOE.test(this.sioe)){
                this.message+= "<p>Campo SIOE está no formato errado</p>";
                return false;
            }

            var dataObj = {
                designacao: this.designacao,
                sigla: this.sigla,
                sioe: this.sioe,
                internacional: this.internacional,
                tipologias: this.tipologiasSel
            }

            this.$http.post('/api/entidades/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function () {
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
    }
})