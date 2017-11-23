var perfil = new Vue({
    el: '#profile',
    data: {
        edit: {
            Name: false,
            Email: false,
            Password: false,
        },
        newName: null,
        newEmail: null,
        newPassword: null,
        newPassword2: null,
    }
})