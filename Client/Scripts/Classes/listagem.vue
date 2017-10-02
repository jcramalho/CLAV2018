
var classes = new Vue({
    el: '#tabela-classes',
    data: {
        subReady: {},
        tableHeader: [],
        tableData: [],
        ready: false,
        content: [],
        cwidth: ['96%'],
        subTemp: []
    },
    methods: {
        swap: function(array,pos1,pos2){
            var temp=array[pos1];
            array[pos1]=array[pos2];
            array[pos2]=temp;

            return array;
        },
        dropClicked: function(params){
            var id = params.id;
            var rowData = params.rowData;

            if(!this.subReady[id]){
                //split the id; example: '1.1.2' becomes ['1','1','2']
                var path = id.split('.');

                this.loadSub(path,this.tableData,params);
            }
        },
        loadSub: function(indexes,location,params){
            if(indexes.length==1){
                this.$http.get("/childClasses?parent="+params.rowData[0])
                .then( function(response) { 
                    this.subTemp = response.body;
                })
                .then( function() {
                    //load child classes on the sublevel of the parent
                    location[indexes[0]].sublevel= this.parseSub();

                    //let child components know that the rows are ready to render
                    this.subReady[params.id]=true;
                })
                .catch( function(error) { 
                    console.error(error); 
                });
            }
            else{
                //get the path tail
                var tail = indexes.splice(1,indexes.length-1);

                //next level in the data structure
                var newLocation = location[indexes[0]].sublevel;

                this.loadSub(tail,newLocation,params);
            }
        },
        rowClicked: function(params){
            console.log(params);
        },
        parse: function(){
            var temp={content:"",sublevel:false};
            // parsing the JSON
            for (var i=0; i<this.content.length; i++) {
                var classN1= this.content[i].N1.value;

                temp.content = [classN1.replace(/[^#]+#(.*)/,'$1')];
                
                if(this.content[i].NChilds.value>0){
                    temp.sublevel=true;
                }

                this.tableData[i]=JSON.parse(JSON.stringify(temp));
            }
        },
        parseSub: function(location){
            var ret=[]
            var temp={content:"",sublevel:false};
            // parsing the JSON
            for (var i=0; i<this.subTemp.length; i++) {
                var classNx= this.subTemp[i].Child.value;

                temp.content = [classNx.replace(/[^#]+#(.*)/,'$1')];
                
                if(this.subTemp[i].NChilds.value>0){
                    temp.sublevel=true;
                }

                ret[i]=JSON.parse(JSON.stringify(temp));
            }
            return ret;
        }
    },
    created: function(){
        this.tableHeader=[
            "CLASSE"
        ];

        this.$http.get("/classesN1")
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