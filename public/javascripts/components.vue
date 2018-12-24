Vue.component('custom-table-simple', {
    template: `
        <div>
            <div class="col-sm-4">
                Mostrar
                <select v-model="rowsPerPage">
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                    <option>100</option>
                </select>
                entradas
            </div>
            <div class="col-sm-7">
                <input class="form-control" v-model="filt" type="text" placeholder="Filtrar"/>
            </div>
            <div class="col-sm-1"  v-if="add" style="float:right">
                <button type="button" class="btn btn-default btn-circle" @click="addClick">
                    <span class="glyphicon glyphicon-plus"/>
                </button>
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
            "nPages": 1,
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
            this.$emit('row-clicked', this.rowsShow[index].idClasse);
        },
        addClick: function (index) { //emit event when the '+' button is clicked
            this.$emit('add-clicked');
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
            //alert(JSON.stringify(this.rowsShow))
        },
    },
    beforeMount: function () {
        this.firstLoad();
        this.rows = this.completeRows;
    }
})


Vue.component('custom-table-select', {
    template: `
        <div style="padding-bottom:30px">
            <div class="col-sm-4">
                Mostrar
                <select v-model="rowsPerPage">
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                    <option>100</option>
                </select>
                entradas
            </div>
            <div class="col-sm-7">
                <input v-if="!nosearch" class="form-control" v-model="filt" type="text" placeholder="Filtrar"/>
            </div>

            <table :class="classTable">
                <thead v-if="header">
                    <tr>
                        <th style="width: 4%"></th>
                        <th v-if="index=>0" v-for="(item,index) in header" @click="sort(index)" class="sorter" :style="{width: cwidth[index]}">
                            {{ item }} <span class="caret"></span>
                        </th>
                    </tr>
                </thead>
                <tbody name="table">
                    <tr v-if="completeRows.length>0" v-for="(row,index) in rowsShow" :key="row[0]">
                        <td>
                            <input
                                type="checkbox"
                                v-model="row.selected"
                                @click="selectClicked(index)"
                            />
                        <td 
                            v-for="(item,idx) in row.data" 
                            class="custom-table-cell-select"
                            @click="selectRow(index)"
                        >
                            <div 
                                class="custom-table-text" 
                                v-html="item"
                                :title="item"
                            ></div>
                        </td>
                    </tr>
                    <tr v-else>
                        <td colspan=3>Lista vazia.</td>
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
        'nosearch',
        'completeRows',
        'header',
        'ready',
        'cwidth',
    ],
    data: function () {
        return {
            "rows": [],
            "rowsShow": [[]],
            "filt": '',
            "order": 0,
            "activePage": 1,
            "pages": [0],
            "rowsPerPage": 10,
            "nPages": 1,
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
        selectRow: function (index) {
            this.$emit('select-clicked', this.rowsShow[index]);
            this.rowsShow[index].selected = !this.rowsShow[index].selected;
        },
        selectClicked: function (index) { //emit event when a row is selected
            this.$emit('select-clicked', this.rowsShow[index]);
        },
        completeFilter: function (filt) { //filter rows according to what is written in the input box
            tempRows = this.completeRows;

            filters = filt.split(" ");

            for (i = 0; i < filters.length; i++) {
                tempRows = this.filter(tempRows, filters[i]);
            }

            this.rows = tempRows;
        },
        filter: function (list, filt) {
            var retList;

            regex = new RegExp(filt, "gi");

            retList = list.filter(function (item) {
                if (item.selected) {
                    return true;
                }

                for (let cell of item.data) {
                    if (regex.test(cell)) {
                        return true;
                    }
                }
                return false;
            })
            if (retList.length == 0) {
                retList = [[]];
            }

            return retList;
        },
        sort: function (index) { //sort rows by header[index]
            if (this.order == index) {
                this.rows.reverse();
                this.order = -index;
            } else {
                this.rows.sort(function (a, b) {
                    if (typeof a.data[index] === 'string' || a.data[index] instanceof String)
                        return a.data[index].localeCompare(b.data[index]);
                    else
                        return a.data[index] - b.data[index];
                })
                this.order = index;
            }
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


/* Vue.component('row-waterfall', {
    template: `
        <tr>
            <td colspan=6 :class="[root ? 'cascata-row-root' : 'cascata-row']">
                <table class="partial-hover cascata-table-within" :class="tableClass">
                    <tbody name="table">
                        <tr>
                            <td 
                                v-if="row.sublevel" 
                                @click="row.drop=!row.drop"
                                :class="[(selectLeft && level>=3) ? 'cascata-drop-select cascata-plus' :'cascata-drop cascata-plus']"
                            >
                                <input
                                    v-if="selectLeft && level>=3"
                                    :id="'left'+id+suffix"
                                    type="checkbox"
                                    v-model="row.selected"
                                    @click="leftSelectClicked"
                                />
                                <span
                                    :for="'toggle'+id+suffix"
                                    :class="[row.drop ? 'glyphicon glyphicon-minus' : 'glyphicon glyphicon-plus']"
                                />
                            </td>
                            
                            <td v-else class="cascata-drop">
                                <input
                                    v-if="selectLeft && level>=3"
                                    :id="'left'+id+suffix"
                                    type="checkbox"
                                    v-model="row.selected"
                                    @click="leftSelectClicked"
                                />
                                <span style="padding-right:18px"></span>
                            </td>

                            <td class="cascata-codigo" :class="[row.active ? 'cascata-active' : '']" @click="rowClicked" :title="row.title">
                                {{ row.content[0] }}
                            </td>

                            <td v-if="row.content[1]" class="cascata-texto" @click="rowClicked">
                                <div>
                                    <div style="float:left" :title="row.content[1]">
                                        {{ row.content[1] }}
                                    </div>
                                    <div
                                        v-if="selectOn && level==3" 
                                        class="checks"
                                    >
                                        <div class="ownercheck">
                                            <input
                                                :id="'owner'+id+suffix"
                                                type="checkbox"
                                                v-model="row.owner"
                                                @click="ownerClicked"
                                            />
                                        </div>
                                        <div class="partcheck">
                                            <input
                                                :id="'participant'+id+suffix"
                                                type="checkbox"
                                                v-model="row.participant"
                                                @click="participantClicked"
                                            />
                                            <select 
                                                :id="'participantType'+id+suffix"
                                                v-if="row.participant"
                                                v-model="row.participantType"
                                                @change="partTypeSelected"
                                            >
                                                <option>Apreciar</option>
                                                <option>Assessorar</option>
                                                <option>Comunicar</option>
                                                <option>Decidir</option>
                                                <option>Iniciar</option>
                                                <option>Executar</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <row-waterfall v-if="row.drop && row.filhos.length>0"
                            v-for="filho in row.filhos"

                            :select-on="selectOn"
                            :select-left="selectLeft"
                            :id="filho.codigo"
                            :row="filho"
                            :key="filho.codigo"
                            :cwidth="cwidth"
                            :suffix="suffix"

                            @eventWaterfall="eventPass($event)"

                            :table-class="tableClass+' cascata'"
                        />
                    </tbody>
                </table>
            </td>
        </tr>
    `,
    props: [
        'row',
        'tableClass',
        'cwidth',
        'id',
        'selectOn',
        'selectLeft',
        'root',
        'suffix',
    ],
    data: function () {
        return {
            relations: ['owner', 'participant'],
            drop: {},
            selected: {},
            level: this.id.split('.').length,
        }
    },
    methods: {
        selectClicked: function () { //emit event when a row is selected
            var eventContent = {
                suffix: this.suffix,
                type: "select",
                params: {
                    id: this.id,
                    rowData: this.row
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        leftSelectClicked: function () { //emit event when a row is selected
            var eventContent = {
                type: "left-select",
                suffix: this.suffix,
                id: this.id,
                rowData: this.row
            };
            this.$emit('eventWaterfall', eventContent);
        },
        ownerClicked: function () { //emit event when an owner "checkbox" is selected
            if (!this.row.participant) {
                this.selectClicked();
            }
        },
        participantClicked: function () { //emit event when a "participant" checkbox is selected
            if (!this.row.owner) {
                this.selectClicked();
            }
        },
        dropClicked: function () { //emit event when a row is expanded
            var eventContent = {
                suffix: this.suffix,
                type: "drop",
                params: {
                    id: this.id,
                    rowData: this.row
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        rowClicked: function () { //emit event when a row is clicked
            var eventContent = {
                type: "row",
                params: {
                    id: this.id,
                    trueID: this.row.codeID,
                    rowData: this.row.content
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        genId: function (index) { //generate an ID for the child component
            return this.id + "." + index;
        },
        eventPass: function (event) { //pass up an event from child component
            this.$emit('eventWaterfall', event);
        }
    },
}) */


/* Vue.component('custom-table-waterfall', {
    template: `
        <div id="root" class="custom-table-waterfall">
            <div id="pages" class="col-sm-4" v-if="pagesOn" style="margin-bottom:5px">
                Mostrar
                <select v-model="rowsPerPage">
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                    <option>100</option>
                </select>
                entradas
            </div>

            <div :class="[sidebar ? '' : 'col-sm-7']" v-if="filterOn">
                <input 
                    class="form-control" 
                    :class="[filtError ? 'form-error' : '']" 
                    v-model="filt" 
                    type="text" 
                    placeholder="Pesquisa por código e/ou título"
                />
            </div>
            <div class="col-sm-1"  v-if="add" style="float:right">
                <button type="button" class="btn btn-default btn-circle" @click="addClick">
                    <span class="glyphicon glyphicon-plus"/>
                </button>
            </div>

            <table id="masterTable" :class="tableClass">
                <thead v-if="header">
                    <tr>
                        <th style="width: 30px; min-width: 30px"></th>
                        <th
                            v-for="(item,index) in header"
                            class="sorter"
                            :style="{width: cwidth[index]}"
                        >
                            {{ item }} 
                        </th>
                        <th v-if="selectOn">
                            Dono
                        </th>
                        <th v-if="selectOn">
                            Participante
                        </th>
                        <th v-if="selectOn">
                            <div style="width:15px"></div>
                        </th>
                    </tr>
                </thead>
                <tbody name="table">
                    <tr v-if="rows.length==0">
                        <td colspan=6>
                            Nenhum resultado encontrado...
                        </td>
                    </tr>
                    <row-waterfall
                        v-if="rows.length>0"
                        v-for="(row,index) in rowsShow"

                        :select-on="selectOn"
                        :select-left="selectLeft"
                        :row="row"
                        :id="genID(index)"
                        :key="row.index"
                        :cwidth="cwidth"
                        :suffix="suffix"

                        :table-class="tableClass+' cascata'"
                        root="true"

                        @eventWaterfall="eventPass($event)"
                    />
                </tbody>
            </table>

            <div class="pages" v-if="pagesOn">
                <span class="glyphicon glyphicon-chevron-left page-number" @click="prevPage"></span>
                <span class="page-number btn btn-xs btn-default" v-for="page in pages" :class="{active: page==activePage}" @click="loadPage(page)">\ {{ page }}\ </span>
                <span class="glyphicon glyphicon-chevron-right page-number" @click="nextPage"></span>
            </div>
        </div>
    `,
    props: [
        'cwidth',
        'table-class',
        'url',
        'completeRows',
        'header',
        'pagesOn',
        'add',
        'selectOn',
        'selectLeft',
        'nEdits',
        'suffix',
        'filterOn',
        'sidebar'
    ],
    data: function () {
        return {
            "rows": [],
            "rowsShow": [],
            "order": 0,
            "activePage": 1,
            "pages": [0],
            "rowsPerPage": 10,
            "filt": "",
            "filtered": false,
            "filtError": false,
        };
    },
    watch: {
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
        nEdits: function () {
            if (this.filtered) {
                this.newFilter();
            }
        },
        filt: function () {
            this.completeFilter(this.filt.replace(/([\[\]\(\)\\\/])/g,"\\$1"));
        }
    },
    methods: {
        completeFilter: function (filt) { //filter rows according to what is written in the input box
            this.filtError=false;
            let tempRows = JSON.parse(JSON.stringify(this.completeRows));

            if(filt!=""){
                let filters = filt.split(" ");
                let codeFormat = /^[0-9]{1,3}(\.[0-9]{0,2}(\.[0-9]{0,3}(\.[0-9]{0,3})?)?)?$/;

                for (let f of filters) {
                    if(codeFormat.test(f)){
                        tempRows = this.filterCode(tempRows, f); 
                    }
                    else{
                        //this.filtError=true;
                        tempRows = this.filterText(tempRows, f);                
                    }
                }
            }
            
            this.rows = tempRows;
        },
        filterCode: function (list, code) {
            var levels = code.split('.');
            return this.filterCodeLevel(list, levels, 1);
        },
        filterCodeLevel: function (list, codeList, level) {
            var code = "";
            for (let i = 0; i < level; i++) {
                code += codeList[i] + ".";
            }
            code = code.slice(0, -1);

            var retList = list.filter(function (item) {
                return item.content[0].includes(code);
            });

            if (level < codeList.length) {
                for (let item of retList) {
                    if (item.sublevel) {
                        item.sublevel = this.filterCodeLevel(item.sublevel, codeList, level + 1);
                        item.drop = true;
                    }
                }
            }

            return retList;
        },
        filterText: function (list, filt) {
            let retList=JSON.parse(JSON.stringify(list));

            regex = new RegExp(filt, "gi");

            for (let item of retList) {
                if (item.sublevel) {
                    let newSub = this.filterText(item.sublevel, filt);
                    
                    if(item.sublevel.length>0){
                        item.drop = true;
                    }

                    item.sublevel=JSON.parse(JSON.stringify(newSub));
                }
            }

            retList = retList.filter(function (item) {
                if(item.indexTerms){
                    for(let ti of item.indexTerms){
                        if(regex.test(ti)){
                            return true;
                        }
                    }
                }
                return ((item.sublevel && item.sublevel.length>0) || regex.test(item.title));
            });

            return retList;
        },
        genID: function (index) {
            for (var i = 0; i < this.completeRows.length; i++) {
                if (this.rowsShow[index].codeID == this.completeRows[i].codeID) {
                    return i + "";
                }
            }
            return "-1";
        },
        sort: function (index) { //sort rows by header[index]
            if (this.order == index) {
                this.rows.reverse();
                this.order = -index;
            } 
            else {
                this.rows.sort(function (a, b) {
                    if (typeof a.content[index] === 'string' || a.content[index] instanceof String)
                        return a.content[index].localeCompare(b.content[index]);
                    else
                        return a.content[index] - b.content[index];
                })
                this.order = index;
            }
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
            
            if (page > n && n!=0) {
                this.loadPage(n);
            } else {
                this.prepPage();
            }
        },
        loadPage: function (page) { //change active page
            if (page != this.activePage && page > 0 && page <= this.pages.length) {
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
        eventPass: function (event) { //process event comming from child component
            if (event.type == "row") {
                this.$emit('row-clicked', event.params);
            }
            else if (event.type == "drop") {
                if (event.suffix) {
                    this.$emit('drop-clicked-' + event.suffix, event.params);
                }
                else {
                    this.$emit('drop-clicked', event.params);
                }
            }
            else if (event.type == "select") {
                if (event.suffix) {
                    this.$emit('select-clicked-' + event.suffix, event.params);
                }
                else {
                    this.$emit('select-clicked', event.params);
                }
            }
            else if (event.type == "left-select") {
                this.$emit('left-select-clicked', event);
            }
        },
        addClick: function (index) { //emit event when the '+' button is clicked
            this.$emit('add-clicked');
        },
    },
    beforeMount: function () {
        this.firstLoad();
        this.rows = this.completeRows;
    },
    created: function () {
        if (!this.pagesOn) {
            this.rowsPerPage = this.completeRows.length;
        }
    }
}) */

Vue.component('hidden-table-v2', {
    template: `
        <accordion :type="tabClass">
            <panel :header="titulo" :is-open="open">
                <table class="hidden-table">
                    <tbody>
                        <tr v-for="linha in linhas">
                            <td v-for="(item,i) in linha">
                                <div 
                                    width="100%"
                                    v-html="item"
                                ></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </panel>
        </accordion>
    `,
    props: [
        'titulo',
        'cabecalho',
        'linhas',
        'open',
        'tableClass'
    ],
    computed: {
        tabClass: function(){
            return this.tableClass ? this.tabClass : 'custom';
        }
    },
    components: {
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
    },
    methods: {
        emitEvent: function (evento) {
            console.log(evento);
        }
    }
})

Vue.component('hidden-table', {
    template: `
        <accordion :type="tabClass">
            <panel :header="titulo" :is-open="open">
                <table class="hidden-table">
                    <thead>
                        <th v-for="item in cabecalho">
                            <div :class="{ 'blue-border-box': item!=''}">
                                {{item}}
                            </div>
                        </th>
                    </thead>
                    <tbody>
                        <tr v-for="linha in linhas">
                            <td v-for="(item,i) in linha">
                                <div 
                                    width="100%"
                                    :class="{ 'blue-border-box': (i<linha.length-1)}" 
                                    v-html="item"
                                ></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </panel>
        </accordion>
    `,
    props: [
        'titulo',
        'cabecalho',
        'linhas',
        'open',
        'tableClass'
    ],
    computed: {
        tabClass: function(){
            return this.tableClass ? this.tabClass : 'custom';
        }
    },
    components: {
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
    },
    methods: {
        emitEvent: function (evento) {
            console.log(evento);
        }
    }
})

Vue.component('normal-table', {
    template: `
            <table class="normal-table">
                <thead>
                    <th v-for="item in cabecalho">
                        <div :class="{ 'blue-border-box': item!=''}">
                            {{item}}
                        </div>
                    </th>
                </thead>
                <tbody>
                    <tr v-for="linha in linhas">
                        <td v-for="(item,i) in linha">
                            <div 
                                width="100%"
                                :class="{ 'blue-border-box': (i<linha.length-1)}" 
                                v-html="item"
                            ></div>
                        </td>
                    </tr>
                </tbody>
            </table>
    `,
    props: [
        'cabecalho',
        'linhas',
    ],
    methods: {
        emitEvent: function (evento) {
            console.log(evento);
        }
    }
})


Vue.component('v-select', VueSelect.VueSelect);
