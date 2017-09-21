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
        parse: function(){    
            this.orgName=this.content[0].Nome.value;
            this.orgInitials=this.content[0].Sigla.value;
        },
        update: function(){
            var args='?id='+this.id;

            if(this.editName && this.newName){
                args+='&name='+this.newName;
            }
            if(this.editInitials && this.newInitials){
                args+='&initials='+this.newInitials;
            }
            console.log(args);
        }
    },
    created: function(){
        this.id=this.getParameterByName('id');

        this.$http.get("/singleOrg?id="+this.id)
        .then( function(response) { 
            this.content = response.body;
        })
        .then( function() {
            this.parse();
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})