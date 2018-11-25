var newOrg = new Vue({
    el: '#nova-entidade-form',
    data: {
        tipologias: [],
        ready: false,

        designacao: "",
        sigla: "",
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
            console.log(this.tipologias)
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
        spinner: VueStrap.spinner
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
            this.tipologiasSel.push(this.tipologias[ind])
        },
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                designacao: this.designacao,
                sigla: this.sigla,
                internacional: this.internacional,
                tipologias: this.tipologiasSel
            }

            this.$http.post('/api/entidades/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response) {
                    this.$refs.spinner.hide();
                    
                    console.log(response)
                    if (response.body != "Designação e/ou Sigla já existente(s)!") {
                        window.location.href = '/pedidos/submissao';
                    }
                    else {
                        messageL.showMsg(response.body);
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        }
    }
})