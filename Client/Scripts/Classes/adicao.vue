var newClass = new Vue({
    el: '#nova-classe-form',
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
        createAppNotes: function (code) {
            var ids = "ids=";
            var content = "&content=";

            for (var i = 0; i < this.appNotes.length; i++) {
                ids += "ne." + code + "_" + (i + 1) + "+";
                content += this.appNotes[i] + "+";
            }

            var params = "?" + ids + content

            console.log(params);
        },
        createDelNotes: function (code) {
            var ids = "ids=";
            var content = "&content=";

            for (var i = 0; i < this.delNotes.length; i++) {
                ids += "ne." + code + "_" + (i + 1) + "+";
                content += this.delNotes[i] + "+";
            }

            var params = "?" + ids + content

            console.log(params);
        },
        prepList: function (pref, list) {
            var ret = pref+"=";

            for (var i = 0; i < list.length(); i++) {
                ret += list[i].id + "-";
            }

            return ret;
        },
        add: function () {
            this.createAppNotes('c' + this.code);
            this.createDelNotes('c' + this.code);

            var owners= this.prepList("owners",this.ownerList);
            var legs= this.prepList("legs",this.ownerList);


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