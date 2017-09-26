var newLeg = new Vue({
    el: '#nova-legislacao-form',
    data: {
        legData : {
            year: {
                label: "Ano",
                value: "",
            },
            date: {
                label: "Data",
                value: "",
            },
            number: {
                label: "Número",
                value: "",
            },
            type: {
                label: "Tipo",
                value: "",
            },
            title: {
                label: "Título",
                value: "",
            },
            link: {
                label: "Link",
                value: "",
            },
        },
        message: "",
    },
    methods: {
        add: function(){
            var args='?id='+this.id;
            
            keys=["year","date","number","type","title","link"];

            for(var i=0;i<6;i++){
                args+='&'+keys[i]+'='+this.legData[keys[i]].value;
            }

            this.$http.get('/createLeg'+args)
            .then( function(response) { 
                this.message = response.body;
            })
            .catch( function(error) { 
                console.error(error); 
            });
        }
    }
})