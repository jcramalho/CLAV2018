var perfil = new Vue({
    el: '#profile',
    data: {
        edit: {
            Level : false
        },
        level: "",
        selected: "Utilizador Simples",
    },
    methods: {
        update: function () {
            if (!this.edit.Level) {
                return false;
            }else{
                switch(this.selected) {
                    case 'Administrador de Perfil Tecnológico':
                        this.level = 7;
                        break;
                    case 'Administrador de Perfil Funcional':
                        this.level = 6;
                        break;
                    case 'Utilizador Validador':
                        this.level = 5;
                        break;
                    case 'Utilizador Avançado':
                        this.level = 4;
                        break;
                    case 'Utilizador Decisor':
                        this.level = 3;
                        break;
                    case 'Utilizador Simples':
                        this.level = 2;
                        break;
                    case 'Representante Entidade':
                        this.level = 1;
                        break;
                }
    
                var dataObj = {
                    Level: this.level,
                    id: window.location.pathname.split('/')[3],
                }
    
                this.$http.post('/users/atualizarNivel', dataObj, {
                    headers: {
                        'content-type': 'application/json'
                    }
                }).then(function (response) {
    
                }).catch(function (error) {
                    console.error(error);
                });
            }
        },
    },
})