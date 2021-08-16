exports.templateEmails = function (titulo, conteudo) {
    return  "<div style='min-height: 400px; border: 1px solid #c3c3c3; background-color: #c3c3c3;'><div style='background-color: white; padding: 10px; width: 50%; max-height: 80%;'><h1>" 
        + titulo + 
        "</h1><div>"
        + conteudo + 
        "</div></div></div>";
}