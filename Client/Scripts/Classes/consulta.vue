var classe = new Vue({
    el: '#classe-form',
    data: {
        id: "",
        orgList: [],
        clas: {
            Title: "",
            Code: "",
            Parent: {
                id: "",
                code: "",
                title: "",
            },
            Status: "",
            Desc: "",
            ProcType: "",
            ProcTrans: "",
            Owners: [],
            Legs: [],
        },
        newClass: {
            Title: "",
            Status: "",
            Desc: "",
            ProcType: "",
            ProcTrans: "",
            Owner: "",
            Owners: [],
            Legs: [],
        },
        edit: {
            Title: false,
            Status: false,
            Desc: false,
            ProcType: false,
            ProcTrans: false,
            Owners: false,
            Legs: false,
        },  
        ownersReady: false,      
    },
    methods: {
        getParameterByName: function(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },
        loadOrgs: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla"];

            this.$http.get("/orgs")
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    this.orgList = this.parse(orgsToParse, keys);
                    this.orgsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },   
        loadOwners: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla"];

            this.$http.get("/ownersClass?id="+this.id)
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    this.clas.Owners = this.parse(orgsToParse, keys);
                    this.ownersReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parse: function (content, keys) {
            var dest = [];
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }

                dest[i] = JSON.parse(JSON.stringify(temp));
            }

            return dest;
        },
        prepData: function(dataObj){   
            this.clas.Title=dataObj.Titulo.value;
            this.clas.Code=dataObj.Codigo.value;

            console.log()

            if(dataObj.Pai){
                this.clas.Parent.id=dataObj.Pai.value.replace(/[^#]+#(.*)/, '$1');
                this.clas.Parent.code=dataObj.CodigoPai.value;
                this.clas.Parent.title=dataObj.TituloPai.value;
            }
            if(dataObj.Status){
                this.clas.Status=dataObj.Status.value;
            }
            if(dataObj.Desc){
                this.clas.Desc=dataObj.Desc.value;
            }
            if(dataObj.ProcTipo){
                this.clas.ProcType=dataObj.ProcTipo.value;
            }
            if(dataObj.ProcTrans){
                this.clas.ProcTrans=dataObj.ProcTrans.value;
            }
            
            this.loadOwners();
            this.loadOrgs();
        },
        update: function(){
            /*var args='?id='+this.id;

            if(this.editName && this.newName){
                args+='&name='+this.newName;
            }
            if(this.editInitials && this.newInitials){
                args+='&initials='+this.newInitials;
            }

            this.$http.get('/updateOrg'+args)
            .then( function(response) { 
                this.message = response.body;
            })
            .catch( function(error) { 
                console.error(error); 
            });*/
        },
        delReady: function(){
            this.message="Tem a certeza que deseja apagar?";
            this.delConfirm=true;
        },
        delNotReady: function(){
            this.message= "";
            this.delConfirm=false;
        },
        deleteClass: function(){
            this.$http.post('/deleteClass',{id: this.id})
            .then( function(response) { 
                this.message = response.body;
            })
            .catch( function(error) { 
                console.error(error); 
            });
        } 
    },
    created: function(){
        this.id=this.getParameterByName('id');
        this.clas.Level=this.id.split('.').length;

        var content;

        this.$http.get("/singleClass?id="+this.id)
        .then( function(response) { 
            content = response.body;
        })
        .then( function() {
            this.prepData(content[0]);
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})