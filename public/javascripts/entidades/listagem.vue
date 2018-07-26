var orgs = new Vue({
    el: '#tabela-entidades',
    data: {
        tableData: [],
        ready: false,
        content: [],
    },
    methods: {
        rowClicked: function(row){
            var id = this.content[row[0]-1].id.value;
            id = id.replace(/[^#]+#(.*)/,'$1');
            
            window.location.href = '/entidades/consultar/'+id;
        },
        parse: function(){    
            // key names for table header and parsing
            var keys=["Designacao","Sigla","Internacional"];

            var temp=[];

            // parsing the JSON
            for (var i=0; i<this.content.length; i++) {
                temp[0]=i+1;

                for (var j=0; j<keys.length; j++){
                    temp[j+1] = this.content[i][keys[j]].value;
                }
                
                this.tableData[i]=temp.slice();

            }
            
        }
    },
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