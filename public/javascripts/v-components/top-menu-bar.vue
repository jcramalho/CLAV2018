Vue.component('top-menu-bar', {
  template: `
    <nav class="navbar fixed-top navbar-expand-lg navbar-dark" :style="topMenuStyle">
        <a class="navbar-brand" href="/">CLAV</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#demo-navbar" aria-controls="demo-navbar" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="demo-navbar">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-light" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Classes
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="#">Criar</a>
                        <a class="dropdown-item" href="#">Consultar</a>
                        <a class="dropdown-item" href="#">Alterar</a>
                        <a class="dropdown-item" href="#">Desativar</a>
                        <a class="dropdown-item" href="/classes">Listar</a>
                    </div>
                </li>
 
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-light" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Entidades
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="#">Criar</a>
                        <a class="dropdown-item" href="#">Consultar</a>
                        <a class="dropdown-item" href="#">Alterar</a>
                        <a class="dropdown-item" href="#">Desativar</a>
                        <a class="dropdown-item" href="#">Listar</a>
                    </div>
                </li>
      
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-light" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Tipologias de Entidades
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="#">Criar</a>
                        <a class="dropdown-item" href="#">Consultar</a>
                        <a class="dropdown-item" href="#">Alterar</a>
                        <a class="dropdown-item" href="#">Desativar</a>
                        <a class="dropdown-item" href="#">Listar</a>
                    </div>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-light" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Legislação
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="#">Criar</a>
                        <a class="dropdown-item" href="#">Consultar</a>
                        <a class="dropdown-item" href="#">Alterar</a>
                        <a class="dropdown-item" href="#">Desativar</a>
                        <a class="dropdown-item" href="#">Listar</a>
                    </div>
                </li>
            </ul>
        </div>
    </nav>
  `,
  computed: {
    topMenuStyle: function() {
      return `{
        background: #0575E6;  
        background: -webkit-linear-gradient(to right, #021B79, #0575E6);  
        background: linear-gradient(to right, #021B79, #0575E6);
      }`
    }
  }
});