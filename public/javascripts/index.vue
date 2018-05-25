new Vue({
    el: '#acordeao',
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel
    }
})

new Vue({
    el: '#navegacao',
    data: {
        linhas: [
            {
                valor: 'Lista Consolidada - Processos de Negócio',
                consultar: '/classes',
                submeter: '/classes/adicionar',
            },
            {
                valor: 'Tabelas de Seleção',
                consultar: '/tabelasSelecao',
                submeter: '/tabelasSelecao/submeter/passos',
            },
            {
                valor: 'Autos de Eliminação (WIP)',
                consultar: '#',
                submeter: '#',
            },
            {
                valor: 'Entidades',
                consultar: '/organizacoes',
                submeter: '/organizacoes/adicionar',
            },
            {
                valor: 'Legislação',
                consultar: '/legislacao',
                submeter: '/legislacao/adicionar',
            },
            {
                valor: 'Estatísticas (WIP)',
                consultar: '#',
                submeter: '#',
            },
        ],
    },
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel
    }
})

new Vue({
    el: '#noticias',
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel
    },
    data: {
        noticias: [
            {
                title: "Projeto de Decreto-Lei que torna obrigatório o usa da plataforma CLAV encontra-se em Tramitação",
                date: "20 de maio de 2018",
                body: `<p>Encontra-se em tramitação a proposta de Decreto-Lei que torna obrigatório o uso da Plataforma CLAV, o uso da Lista Consolidada e a elaboração de tabelas de classificação e avaliação da informação decorrente do exercício de funções públicas, entre outras, nas seguintes entidades: </p>
                <ol type="a">
                    <li>O Estado, incluindo os ministérios, os gabinetes dos membros do Governo, os tribunais e o Ministério Público;</li>
                    <li>As autarquias locais;</li>
                    <li>Os institutos públicos; </li>
                    <li>As entidades administrativas independentes;</li>
                    <li>As fundações públicas;</li>
                    <li>As associações públicas;</li>
                    <li>Entidades do setor público empresarial;</li>
                    <li>Outras entidades no exercício de funções materialmente administrativas ou de poderes públicos, nomeadamente instituições particulares de solidariedades social, pessoas coletivas de utilidade pública administrativa, notários, agentes de execução ou entidades que sejam titulares de concessões ou de delegações de poderes públicos;</li>
                    <li>Outras entidades públicas ou privadas cujos arquivos ou património arquivístico e fotográfico tenha sido objeto de classificação ao abrigo do regime de proteção do património cultural.</li>
                </ol>
                <p>O projeto de diploma refere que, após a sua aprovação, as entidades abrangidas têm um período de 3 anos para a aprovação da sua tabela de classificação e avaliação. Enquanto tal não acontece, as entidades que possuem portarias de gestão de documentos ao abrigo do Decreto-Lei n.º 447/88 poderão continuar a utilizá-las.</p>
                `
            }
        ]
    }
})