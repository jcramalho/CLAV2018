var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",
        orgName: "",
        newName: "",
        editName: false,
        orgInitials: "",
        newInitials: "",
        editInitials: false,
        content: [],
        message: "",
        delConfirm: false,
        domain: [],
        newDomain: [],
        domainReady: false,
        editDomain: false,

        participations: [],
        newParticipations: [],
        partsReady: false,
        editParts: false,
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
        loadDomain: function () {
            var classesToParse = [];
            var keys = ["id", "Codigo", "Titulo"];

            this.$http.get("/domainOrg?id=" + this.id)
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.domain = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));
                    this.newDomain = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));

                    this.domainReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipations: function () {
            var partsToParse = [];
            var keys = ['id', 'Titulo', 'Codigo'];

            this.$http.get("/partsOrg?id=" + this.id)
                .then(function (response) {
                    partsToParse = response.body;
                })
                .then(function () {
                    this.participations = this.parseParticipants(partsToParse, keys);
                    this.newParticipations = JSON.parse(JSON.stringify(this.participations));

                    this.partsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parse: function(){    
            this.orgName=this.content[0].Nome.value;
            this.orgInitials=this.content[0].Sigla.value;
        },
        parseList: function (content, keys) {
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
        parseParticipants: function (content, keys) {
            var dest = {
                Apreciador: [],
                Assessor: [],
                Comunicador: [],
                Decisor: [],
                Executor: [],
                Iniciador: [],
            };
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    
                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }
                var type = content[i].Type.value.replace(/.*temParticipante(.*)/, '$1');

                dest[type].push(JSON.parse(JSON.stringify(temp)));
            }

            return dest;
        },
        update: function(){
            var args='?id='+this.id;

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
            });
        },
        delReady: function(){
            this.message="Tem a certeza que deseja apagar?";
            this.delConfirm=true;
        },
        delNotReady: function(){
            this.message= "";
            this.delConfirm=false;
        },
        deleteOrg: function(){
            this.$http.get('/deleteOrg?id='+this.id)
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

        this.$http.get("/singleOrg?id="+this.id)
        .then( function(response) { 
            this.content = response.body;
        })
        .then( function() {
            this.loadDomain();
            this.loadParticipations();
            this.parse();
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})