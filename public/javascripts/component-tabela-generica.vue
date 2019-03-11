Vue.component('tabela-generica', {
    template: `
        <div>
            <div class="col-sm-3">
                Mostrar
                <select v-model="rowsPerPage">
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                    <option>100</option>
                </select>
                entradas
            </div>
            <div class="col-sm-6">
                <input class="form-control" v-model="filt" type="text" placeholder="Filtrar"/>
            </div>
            <label v-if="nrResults" > Resultados: {{ nrResults }} </label>
            <div class="col-sm-2"  v-if="add" style="float:right" @click="filtClick()">
                    <select v-model="PNsAssociados">
                        <option>Com PNs Associados</option>
                        <option>Sem PNs Associados</option>
                        <option>Todos</option>
                    <select/>
            </div>

            <table :class="classTable">
                <thead v-if="header">
                    <tr>
                        <th v-for="(item,index) in header" @click="sort(index)" class="sorter" :style="{width: cwidth[index]}">
                            {{ item }} <span class="caret"></span>
                        </th>
                    </tr>
                </thead>
                <tbody name="table">
                    <tr v-for="(row,index) in rowsShow" @click="rowClick(index)">
                        <td
                            v-for="campo in displayOrder" 
                            class="custom-table-cell"
                            > 
                            <div 
                                class="custom-table-text" 
                                v-html="row[campo]"></div> 
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="pages">
                <span class="glyphicon glyphicon-chevron-left page-number" @click="prevPage"></span>
                <span class="page-number btn btn-xs btn-default" v-for="page in pages" :class="{active: page==activePage}" @click="loadPage(page)" :disabled="isNaN(page)">\ {{ page }}\ </span>
                <span class="glyphicon glyphicon-chevron-right page-number" @click="nextPage"></span>
            </div>
        </div>
    `,
    props: [
        'classTable',
        'completeRows',
        'header',
        'displayOrder',
        'ready',
        'cwidth',
        'add',
    ],
    data: function () {
        return {
            "rows": [],
            "rowsShow": [],
            "filt": '',
            "order": 0,
            "activePage": 1,
            "pages": [0],
            "rowsPerPage": 10,
            "PNsAssociados": "",
            "nPages": 1,
            "nrResults": "",
        };
    },
    watch: {
        filt: function () {
            this.completeFilter(this.filt);
        },
        rows: function () {
            this.loadPages();
        },
        rowsPerPage: function () {
            this.loadPages();
        },
        activePage: function () {
            this.loadPages();
            this.prepPage();
        },
    },
    methods: {
        completeFilter: function (filt) { //filtra as linhas de acordo com as palavras introduzidas no filtro
            tempRows = this.completeRows;
            filters = filt.split(" ");

            for (i = 0; i < filters.length; i++) {
                tempRows = this.filter(tempRows, filters[i]);
            }

            this.rows = tempRows;
        },
        filter: function (lista, filtro) {
            var retList = []
            regex = new RegExp(filtro, "gi")

            retList = lista.filter(item => {
                var match = false
                Object.values(item).forEach(value => {
                    if(regex.test(value)) match = true
                })
                return match
            })
            this.nrResults = retList.length;
            return retList;
        },
        sort: function (index) { //ordena as linhas por displayOrder[index]
            var chaveOrd = this.displayOrder[index]
            this.rows.reverse()
            this.rows.sort(function (a, b) {
                if (typeof a.chaveOrd === 'string' || a.chaveOrd instanceof String)
                    return a.chaveOrd.localeCompare(b.chaveOrd);
                else
                    return a.chaveOrd - b.chaveOrd;
            })
        },
        rowClick: function (index) { //emit event when a row is clicked
            this.$emit('row-clicked', this.rowsShow[index].id || this.rowsShow[index].codigo );
        },
        filtClick: function () { //filter rows according to what is written in the input box
            this.$emit('filt-clicked', this.PNsAssociados);
        },
        loadPages: function () { //process page numbers
            var page = this.activePage;
            var ret = [];

            var n = Math.ceil(this.rows.length / this.rowsPerPage);

            this.nPages = n;

            if (n > 7) {
                if (page < 5) {
                    ret = [1, 2, 3, 4, 5, "...", n];
                }
                else if (page > n - 4) {
                    ret = [1, "...", n - 4, n - 3, n - 2, n - 1, n];
                }
                else {
                    ret = [1, "...", page - 1, page, page + 1, "...", n];
                }
            }
            else {
                for (var i = 1; i <= n; i++) {
                    ret.push(i);
                }
            }

            this.pages = ret;

            if (page > n) {
                this.loadPage(n);
            } else {
                this.prepPage();
            }
        },
        loadPage: function (page) { //change active page
            if (page != this.activePage && page > 0 && page <= this.nPages) {
                this.activePage = page;
            }
        },
        prepPage: function () { //process rows to be shown
            var beggining = (this.activePage - 1) * this.rowsPerPage;
            var end = beggining + parseInt(this.rowsPerPage);

            this.rowsShow = this.rows.slice(beggining, end);
        },
        nextPage: function () {
            this.loadPage(this.activePage + 1);
        },
        prevPage: function () {
            this.loadPage(this.activePage - 1);
        },
        firstLoad: function () { //loads info upon first render
            var ret = [];

            var n = Math.ceil(this.completeRows.length / this.rowsPerPage);

            for (var i = 1; i <= n; i++) {
                ret.push(i);
            }

            this.pages = ret;

            this.rowsShow = this.completeRows.slice(0, this.rowsPerPage);
        },
    },
    beforeMount: function () {
        this.firstLoad();
        this.rows = this.completeRows;
    }
})