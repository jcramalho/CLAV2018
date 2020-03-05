#Used acme.sh script from https://github.com/acmesh-official/acme.sh

NAME=acme.sh
FOLDER=~/.acme.sh
EXEC=$FOLDER/$NAME
DOMAINS=('clav-api.dglab.gov.pt' 'clav-test.di.uminho.pt')

function join_by {
    local d=$1
    shift
    echo -n "$1"
    shift
    printf "%s" "${@/#/$d}"
}

#Download acme.sh script
downloadInstallScript() {
    #Check if script not exists
    if [ ! -f "$EXEC" ]; then
        wget https://raw.githubusercontent.com/Neilpang/acme.sh/master/acme.sh
        chmod +x $NAME
        ./$NAME --install
        rm $NAME
        $EXEC --upgrade --auto-upgrade
    fi
}

getCertificate() {
    #Check if certificate does not exists
    if [ ! -d "$FOLDER/$DOMAINS" ]; then
        local domains="-d $(join_by ' -d ' ${DOMAINS[@]})"
        $EXEC --staging --issue $domains -w ./public
    fi
}

installCertificate() {
    if [ ! -d ./ssl/$DOMAINS ]; then
        mkdir -p ./ssl/$DOMAINS
    fi

    $EXEC --install-cert -d $DOMAINS \
        --cert-file ./ssl/$DOMAINS/cert.pem \
        --key-file ./ssl/$DOMAINS/key.pem \
        --fullchain-file ./ssl/$DOMAINS/fullchain.pem \
        --reloadcmd "pkill npm && npm start"
}

downloadInstallScript
getCertificate
installCertificate
