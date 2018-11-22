var orgs = new Vue({
    el: '#tabela-entidades',
    data: {
        listaEntidades: [],
        ready: false
    },
    methods: {
        rowClicked: function(eid){
            // permite navegar ate a  entidade em questao
            window.location.href = '/entidades/'+eid;
        },
    },
    // Obtem a listagem normalizada a "/api/entidades"
    created: function(){
        this.$http.get("/api/entidades")
        .then( function(response) { 
            this.listaEntidades = response.body;
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})