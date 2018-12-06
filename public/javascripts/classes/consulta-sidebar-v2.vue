var classesSide = new Vue({
    el: '#sidebar-tabela-classes',
    data: {
        treeData: [],
        treeOptions: {
            checkbox: false,
            propertyNames: {
              text: 'codigo',
              children: 'filhos'
            }
          }
    },
    methods: {
        onNodeSelected(node) {
        	window.location.href = '/classes/consultar/c'+node.text;
        }
    },
    created: function(){
        this.$http.get("/api/classes")
            .then(function (dados) {this.treeData = dados.body;})
            .catch(function (error) {console.error(error);});
    }
})