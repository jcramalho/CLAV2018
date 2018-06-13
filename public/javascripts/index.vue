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
                newCons: 'Consultar e propor alteração',
                newSub: 'Submeter novo PN',
                text: '<p class="info-text">Estrutura de classes da “Lista Consolidada para a classificação e avaliação da informação pública” que atualmente se encontra disponível. Inclui os níveis referentes aos processos de negócio da Administração Pública.</p>',
                notlogged: 'Para novos contributos, faça Login.'
            },
            {
                valor: 'Tabelas de Seleção',
                consultar: '/tabelasSelecao',
                submeter: '/tabelasSelecao/submeter/passos',
                text: '<p class="info-text">Lista das Tabelas de seleção atualmente aprovadas.</p>',
                notlogged: 'Para novas propostas, faça Login.'
            },
            {
                valor: 'Autos de Eliminação (Em desenvolvimento)',
                consultar: '#',
                submeter: '#',
            },
            {
                valor: 'Entidades',
                consultar: '/organizacoes',
                submeter: '/organizacoes/adicionar',
                text: '<p class="info-text">Lista das entidades ou tipologias de entidades que estão envolvidas nos processos de negócio da Administração Pública e que foram identificadas até ao momento. Em atualização constante.</p>',
                notlogged: 'Para novas propostas, faça Login.'
            },
            {
                valor: 'Legislação',
                consultar: '/legislacao',
                submeter: '/legislacao/adicionar',
                text: '<p class="info-text">Lista da legislação que enquadra os processos de negócio da Administração Pública e que foi identificada até ao momento. Em atualização constante.</p>',
                notlogged: 'Para novas propostas, faça Login.'
            },
            {
                valor: 'Estatísticas (Em desenvolvimento)',
                consultar: '#',
                submeter: '#',
            },
        ],
    },
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
    }
})


new Vue({
    el: '#noticias',
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel
    },
    data: {
        noticias: [ //para já "hardcoded", no futuro criar uma forma de gerir as notícias atraves da plataforma
            {
                title: 'RGPD: A "Lista Consolidada para a classificação e avaliação da informação pública" como instrumento facilitador da sua aplicação',
                date: "25 de Maio de 2018",
                body: `<p>O Regulamento Geral de Proteção de Dados ( RGPD ) entra em vigor hoje, 25 de Maio de 2018, e revoga a Diretiva 95/46/CE.</p>
                <p>Para demonstrar como os instrumentos de gestão da informação e dos arquivos são importantes da sua aplicação, a DGLAB disponibiliza uma comunicação recente em que alguns dos seus arquivistas abordaram esta temática, intitulada “<a href="https://www.bad.pt/eventos/wp-content/uploads/2018/01/P.-Barca_LC_CLAV_RGPD_v2.pdf">A Lista Consolidada como instrumento facilitador da aplicação do RGPD</a>”.</p>
                <p>Na comunicação, os autores (Alexandra Lourenço, Pedro Penteado e Rita Gago) salientam a importância da Lista Consolidada para a classificação e avaliação da informação pública [<a href="http://arquivos.dglab.gov.pt/programas-e-projectos/modernizacao-administrativa/macroestrutura-funcional-mef/lista-consolidada/">LINK</a>] para a aplicação do RGPD, na medida em que este instrumento identifica os diversos processos de negócio das entidades públicas aos quais deve estar associada a recolha de dados pessoais. </p>
                <p>A fundamentação para a recolha, tratamento e conservação dos dados pessoais encontra-se facilitada pela utilização da referida Lista Consolidada, que contextualiza, através da inserção destes nos respetivos processos de negócio. Na Lista Consolidada é possível encontrar ainda a definição do tempo que os dados devem ser conservados e o seu destino final, bem como o fundamento legal ou outro que justifica estas ações. </p>
                <p>Os autores salientam também as limitações ao direito ao esquecimento (artigo 17.º do RGPD) que, entre outros, abrangem os arquivos de interesse público, bem como a forma como este direito deve ser aplicado tendo em conta a necessidade de salvaguardar dados e informação de conservação permanente, recorrendo, por exemplo, à pseudonomização. </p>
                <p>A DGLAB, com a disponibilização desta comunicação, assinala o início da entrada em vigor do RGPD, fornecendo aos profissionais da informação um documento facilitador da sua intervenção ao nível da gestão de dados e informação.</p>
                <p>Para mais esclarecimentos, poderá contactar-nos pelo endereço <a href="mailto:dsan@dglab.gov.pt">dsan@dglab.gov.pt</a> . </p>`
            },
            {
                title: "Projeto de Decreto-Lei que torna obrigatório o usa da plataforma CLAV encontra-se em tramitação",
                date: "20 de Maio de 2018",
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