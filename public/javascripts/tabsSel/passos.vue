new Vue({
    el: '#passos',
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel
    },
})

new Vue({
    el: '#nome',
    data: {
        nome: "Teste",
    },
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel
    },
    watch: {
        nome: function(){
            this.saveName()
        }
    },
    methods:{
        saveName: _.debounce(
            function(){
                this.$http.put('/users/save/tsNome', {nome: this.nome}, {
                    headers: {
                        'content-type': 'application/json'
                    }
                })
                    .then(function (response) {
                        var resp = response.body;
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            },
            500
        )
    }
})