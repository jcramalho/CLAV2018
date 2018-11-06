var orgs = new Vue({
    el: '#tabela-entidades',
    data: {
        tableData: [],
        content: [],
        ready: false,
    },
    methods: {
        rowClicked: function(row){
            var id = this.content[row[0]-1].id;
            id = id.replace(/[^#]+#(.*)/,'$1');
            
            window.location.href = '/entidades/'+id;
        },
        parse: function(){    
            var temp=[];

            // adiciona um index à tabela dos dados (para que?)
            for (var i=0; i<this.content.length; i++) {
                temp[0]=i+1;
                temp[1] = this.content[i].designacao;
                temp[2] = this.content[i].sigla;
                temp[3] = this.content[i].internacional;

                this.tableData[i]=temp.slice();
            }
            
        }
    },
    // Vai buscar a listagem normalizada a "/api/entidades"
    created: function(){
        this.$http.get("/api/entidades")
        .then( function(response) { 
            this.content = response.body;
        })
        .then( function() {
            this.parse();
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})