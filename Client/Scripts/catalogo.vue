var reis = new Vue({
    el: '#tabela-organizacoes',
    data: {
        tableHeader: [],
        tableData: [[]],
        ready: false,
        content: [],
    },
    methods: {
        rowClicked: function(row){
            alert(row);
        },
        parse: function(){    
            // key names for table header and parsing
            var keys= Object.keys(this.content[0]);

            // setting the table header
            this.tableHeader=["#"].concat(keys);

            var temp=[];

            // parsing the JSON
            for (var i=0; i<this.content.length; i++) {
                temp[0]=i+1;

                for (var j=0; j<keys.length; j++){
                    temp[j+1] = this.content[i][keys[j]].value;
                }
                
                this.tableData[i]=temp.slice();

            }

            this.ready=true;
        }
    },
    created: function(){
        this.$http.get("/orgs")
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