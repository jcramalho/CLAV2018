var orgs = new Vue({
    el: '#tabela-utilizadores',
    data: {
        listaUsers: [],
        ready: false
    },
    methods: {
        rowClicked: function(uid){
            // permite navegar ate ao user em questao
            window.location.href = '/users/editar/'+uid;
        },
    },
    // Obtem a listagem normalizada a "/api/users"
    created: function(){
        this.$http.get("/api/users")
        .then( function(response) { 
            this.listaUsers = response.body;
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})