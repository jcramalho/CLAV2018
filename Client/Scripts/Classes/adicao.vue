var newClass = new Vue({
    el: '#nova-classe-form',
    http: {
        emulateJSON: true,
        emulateHTTP: true
    },
    data: {
        type: 1,

        parent: "",
        parents: [],
        parentsReady: false,
        code: "",
        newOwner: "",
        ownerList: [],
        orgList: [],
        orgsReady: false,
        newLegislation: "",
        newLegList: [],
        legList: [],
        legsReady: false,
        description: "",
        newAppNote: "",
        appNotes: [],
        newDelNote: "",
        delNotes: [],
        status: "",
        message: "",
    },
    watch: {
        parent: function () {
            this.code = this.parent.slice(1, this.parent.length);
        },
        type: function () {
            this.parent = "";
            if (this.type > 1) {
                this.loadParents();
            }
        }
    },
    methods: {
        addOwner: function (index) {
            this.ownerList.push(this.orgList[index]);
            this.orgList.splice(index, 1);
        },
        remOwner: function (index) {
            this.orgList.push(this.ownerList[index]);
            this.ownerList.splice(index, 1);
        },
        addLeg: function (index) {
            this.newLegList.push(this.legList[index]);
            this.legList.splice(index, 1);
        },
        remLeg: function (index) {
            this.legList.push(this.newLegList[index]);
            this.newLegList.splice(index, 1);
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
        loadLegs: function () {
            var legsToParse = [];
            var keys = ["id", "Número"];

            this.$http.get("/legs")
                .then(function (response) {
                    legsToParse = response.body;
                })
                .then(function () {
                    this.legList = this.parse(legsToParse, keys);
                    this.legsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParents: function () {
            var classesToParse = [];
            var keys = ["id", "Code"];

            this.$http.get("/classesn?level=" + (this.type - 1))
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.parents = this.parse(classesToParse, keys);
                    this.parentsReady = true;
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
        addNewAppNote: function () {
            if (this.newAppNote) {
                this.appNotes.push(this.newAppNote);
                this.newAppNote = '';
            }
        },
        addNewDelNote: function () {
            if (this.newDelNote) {
                this.delNotes.push(this.newDelNote);
                this.newDelNote = '';
            }
        },
        createAppNotes: function (code, list) {
            var dataObj = [];

            for (var i = 0; i < list.length; i++) {
                var temp = {
                    id: "",
                    text: "",
                };

                temp.id = "na_c" + code + "_" + (i + 1);
                temp.text = list[i];

                dataObj[i] = JSON.parse(JSON.stringify(temp));
            }

            this.$http.post('/createAppNotes', { "list": dataObj },{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then(function (response) {
                this.message = response.body;
            })
            .catch(function (error) {
                console.error(error);
            });
        },
        createDelNotes: function (code, list) {
            var dataObj = [];
            
            for (var i = 0; i < list.length; i++) {
                var temp = {
                    id: "",
                    text: "",
                };

                temp.id = "ne_c" + code + "_" + (i + 1);
                temp.text = list[i];

                dataObj[i] = JSON.parse(JSON.stringify(temp));
            }

            this.$http.post('/createDelNotes', { "list": dataObj },{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then(function (response) {
                this.message = response.body;
            })
            .catch(function (error) {
                console.error(error);
            });
        },
        add: function () {

            var appNotesList = [];
            var delNotesList = [];

            for (var i = 0; i < this.appNotes.length; i++) {
                appNotesList[i] = "na_c" + this.code + "_" + (i + 1);
            }
            for (var i = 0; i < this.delNotes.length; i++) {
                delNotesList[i] = "ne_c" + this.code + "_" + (i + 1);
            }

            var dataObj = {
                "level": this.type,
                "parent": this.parent,
                "code": this.code,
                "status": this.status,
                "owners": this.ownerList,
                "legislations": this.newLegList,
                "description": this.description,
                "appNotes": appNotesList,
                "delNotes": delNotesList,
            };

            alert("WIP");


            /* 
                var params = "?name="+this.name+"&initials="+this.initials;
                    
                this.$http.get('/createClasse'+params)
                .then( function(response) { 
                    this.message = response.body;
                })
                .catch( function(error) { 
                    console.error(error); 
                });
            */
        }
    },
    created: function () {
        this.loadOrgs();
        this.loadLegs();
    }
})