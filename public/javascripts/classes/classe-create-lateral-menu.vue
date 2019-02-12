var sideNav = new Vue({
    el: '#sideNav',
    data: {
        completeNav: [
            {
                label: "Início",
                anchor: "#inicio",
                lvl: 1
            },  
            {
                label: "Descritivo",
                anchor: "#descritivo",
                lvl: 1
            },
            {
                label: "Contexto de avaliação",
                anchor: "#contexto",
                lvl: 3
            },
            {
                label: "Subdivisão em 4ºs níveis",
                anchor: "#subdivisao",
                lvl: 3
            },
            {
                label: "Decisões de avaliação",
                anchor: "#decisao",
                lvl: 3
            },
        ],
        sideNav: []
    },
    methods: {
        changeNav: function (type) {
            this.sideNav = this.completeNav.filter(
                a => a.lvl <= type
            )
        }
    },
    mounted() {
        this.changeNav(1);
    }
})
