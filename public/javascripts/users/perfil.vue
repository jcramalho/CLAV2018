var perfil = new Vue({
    el: '#profile',
    data: {
        edit: {
            Name: false,
            Email: false,
            Password: false,
        },
        newName: "",
        newEmail: "",
        newPassword: "",
        newPassword2: "",
        passMessage: "",
        pedidos: [],
        pedidosReady: false,
        trabalhos: [],
        trabalhosReady: false,
    },
    methods: {
        checkready: _.debounce(
            function () {
                this.passMessage = "";
                if (!this.edit.Name && !this.edit.Email && !this.edit.Password) {
                    return false;
                }
                else {
                    var ready = true;
                    if (this.edit.Name) {
                        ready = (ready && this.newName.length > 0);
                    }
                    if (this.edit.Email) {
                        ready = (ready && this.newEmail.length > 0);
                    }
                    if (this.edit.Password) {
                        if (this.newPassword != this.newPassword2) {
                            this.passMessage = "Passwords têm de ser iguais!"
                            return false;
                        }
                        else {
                            ready = (ready && this.newPassword.length > 0);
                        }
                    }
                    return ready;
                }
            },
            300
        ),
        update: function () {
            var dataObj = {
                Name: this.newName,
                Email: this.newEmail,
                Password: this.newPassword,
            }

            this.$http.post('/users/updatePassword', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response) {

                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parsePedidos: function (content) {
            let ret;
            ret = content.map(function (a) {
                let link = "#";
                if (a.tipo == "Novo PN" && a.obj) {
                    link = `/classes/consultar/${a.obj}`;
                }
                else if (a.tipo == "Criação de TS" && a.obj) {
                    link = `/tabelasSelecao/consultar/${a.obj}`;
                }

                return [
                    a.num,
                    a.tipo,
                    a.desc,
                    a.data,
                    `<div class='button-darker'><a href='${link}'>Ver Pedido</a></div>`
                ]
            });
            return ret;
        },
        parseTrabalhos: function (content) {
            let ret = content.map(function (a) {
                let link = "#";
                if (a.tipo == "TS: Alterar PNs" && a.objetoID) {
                    link = `/tabelasSelecao/submeter/alterar_PNs/${a.objetoID}`;
                }
                /*else if(a.tipo=="Criação de TS" && a.obj){
                    link=`/tabelasSelecao/consultar/${a.obj}`;
                }*/

                return [
                    a.data,
                    a.tipo,
                    `<div class='button-darker'><a href='${link}'>Ver Pedido</a></div>`
                ]
            });
            console.log(ret);
            return ret;
        },
        loadPedidos: function () {
            var content = [];

            this.$http.get("/api/pedidos/utilizador")
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {
                    this.pedidos = this.parsePedidos(content);
                    this.pedidosReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadTrabalho: function () {
            var content = [];

            this.$http.get("/api/trabalhos/utilizador")
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {
                    this.trabalhos = this.parseTrabalhos(content);
                    this.trabalhosReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
    },
    created: function () {
        this.loadPedidos();
        this.loadTrabalho();
    }
})