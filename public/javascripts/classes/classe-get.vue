var classe = new Vue({
    el: '#classe-get-form',
    data: {
        message: "",
        id: "",
        
        classe: {},
        
        dadosCarregados: false,
    },
    components: {
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
        spinner: VueStrap.spinner,
        tabs: VueStrap.tabs,
        tabGroup: VueStrap.tabGroup,
        tab: VueStrap.tab,
        modal: VueStrap.modal,
    },
    methods: {
    },
    created: async function () {
        var partes = window.location.pathname.split('/');
        this.id = partes[partes.length-1];
        this.classe.nivel = this.id.split('.').length;
        let response = await axios.get("/api/classes/" + this.id);
        this.classe = response.data;

        this.dadosCarregados = true;
    }
})