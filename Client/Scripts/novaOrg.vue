var newOrg = new Vue({
    el: '#nova-organizacao-form',
    data: {
        name: "",
        initials: "",
        message: "",
    },
    methods: {
        add: function(){
            var params = "?name="+this.name+"&initials="+this.initials;
                
            this.$http.get('/createOrg'+params)
            .then( function(response) { 
                this.message = response.body;
            })
            .catch( function(error) { 
                console.error(error); 
            });
        }
    }
})