var orgs = new Vue({
    el: '#tabela-tipologias',
    data: {
        listaTipologias: [],
        ready: false,
    },
    methods: {
        rowClicked: function(tid){
            // permite navegar ate a tipologia em questao
            
            window.location.href = '/tipologias/'+tid;
        },
    },
    created: function(){
        this.$http.get("/api/tipologias")
        .then( function(response) { 
            this.listaTipologias = response.body;
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})