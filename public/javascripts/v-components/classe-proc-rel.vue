Vue.component('classe-proc-rel', {
    template: `
<ul style="padding-left:20px">
    <li v-for="(p, index) in this.relPorTipo" v-if="p.processos.length > 0">
        <b> {{ p.label }}: </b>
            <ul>
                <li v-for="proc in p.processos">
                    <a :href="'/classes/c' + proc.codigo"> {{ proc.codigo }} </a>
                    - {{ proc.titulo }} 
                </li>
            </ul>
    </li>
</ul>`,

    props: {
            processos: []
        },

    data: function() {
      return {
          relPorTipo: {
            eAntecessorDe: {
                label: "É Antecessor de",
                processos: [] },
            eComplementarDe: {
                label: "É Complementar de",
                processos: [] },
            eCruzadoCom: {
                label: "É Cruzado com",
                processos: [] },
            eSinteseDe: {
                label: "É Síntese de",
                processos: [] },
            eSintetizadoPor: {
                label: "É Sintetizado por",
                processos: [] },
            eSucessorDe: {
                label: "É Sucessor de",
                processos: [] },
            eSuplementoDe: {
                label: "É Suplemento de",
                processos: [] },
            eSuplementoPara: {
                label: "É Suplemento para",
                processos: [] }
        },
      }
    },

    created: function () {
        var tipo;
        for(var i=0; i < this.processos.length; i++){
            tipo = this.processos[i].idRel;
            this.relPorTipo[tipo].processos.push(this.processos[i])
        }
    }
})
