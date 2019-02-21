Vue.component('classe-descendencia', {
    template: `
<div class="list-group-flush">
    <li class="list-group-item" v-for="f in filhos">
        <a v-bind:href="'/classes/c'+f.codigo"> {{ f.codigo }} </a>
        - {{ f.titulo }}
    </li>
</div>`,
    props: {
            filhos: Array
        }
})
