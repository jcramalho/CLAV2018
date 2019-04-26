var orgs = new Vue({
    el: '#tabela-chaves',
    data: {
        listaChaves: [],
        ready: false
    },
    methods: {
        rowClicked: function(uid){
            // permite navegar ate a chave em questao
            window.location.href = '/gestao/listagem_chaves/'+uid;
        },
    },
    // Obtem a listagem normalizada a "/api/chaves/listagem"
    created: function(){
        this.$http.get("/api/chaves/listagem")
        .then( function(response) { 
            this.listaChaves = response.body;
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})