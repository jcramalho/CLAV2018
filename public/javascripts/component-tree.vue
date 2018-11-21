Vue.component('row-waterfall', {
    template: `
        <tr>
            <td colspan=6 :class="[root ? 'cascata-row-root' : 'cascata-row']">
                <table class="partial-hover cascata-table-within" :class="tableClass">
                    <tbody name="table">
                        <tr>
                            <td 
                                v-if="row.filhos.length>0" 
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

                            <td class="cascata-codigo" :class="[row.active ? 'cascata-active' : '']" @click="rowClicked" :title="row.titulo">
                                {{ row.codigo }}
                            </td>

                            <td v-if="row" class="cascata-texto" @click="rowClicked">
                                <div>
                                    <div style="float:left" :title="row.titulo">
                                        {{ row.titulo }}
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
                    id: 'c' + this.row.codigo,
                    trueID: this.row.id,
                    rowData: this.row
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        eventPass: function (event) { //pass up an event from child component
            this.$emit('eventWaterfall', event);
        }
    },
})

// Componente que faz a listagem da árvore de classes
Vue.component('custom-table-waterfall', {
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
                        v-for="row in rowsShow"

                        :select-on="selectOn"
                        :select-left="selectLeft"
                        :row="row"
                        :id="row.codigo"
                        :key="row.codigo"
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
            let tempRows = this.completeRows;

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
})

Vue.component('v-select', VueSelect.VueSelect);
