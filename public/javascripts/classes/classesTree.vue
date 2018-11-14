Vue.component('tree-menu', {
    template: `<div class="tree-menu">
                    <div>{{ label }}</div>
                    <tree-menu 
                        v-for="c in classesTree" 
                        :children="c.filhos" 
                        :label="c.titulo"
                    >
                    </tree-menu>
            </div>`,
    props: [ 'label', 'children' ]
})

var myTree = new Vue({
  el: '#classesTree',
  data: {
    myClassesTree: [],
    ready: false
  },
  created: function(){
    this.$http.get("/api/classes")
        .then(function (response) {
            alert(JSON.stringify(response.body))
            this.myClassesTree = response.body;
            this.ready = true;
        })
        .catch(function (error) {
            console.error(error);
        });
    }
})
  
