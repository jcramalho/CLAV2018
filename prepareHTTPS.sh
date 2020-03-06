#!/bin/bash
#Used acme.sh script from https://github.com/acmesh-official/acme.sh
#necessary packages: openssl, cron, curl

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
    #Install necessary packages
    local packages=('openssl' 'curl')
    local toInstall

    for p in "${packages[@]}"; do
        which $p 2> /dev/null > /dev/null
        if [ $? -ne 0 ]; then
            toInstall+=($p)
        fi
    done

    which crontab 2> /dev/null > /dev/null
    local haveCrontab=$?

    declare -A pkg_mngs
    pkg_mngs[apk]="apk --no-cache add -f"
    pkg_mngs[apt-get]="apt-get install -y"
    pkg_mngs[dnf]="dnf install -y"
    pkg_mngs[yum]="yum -y install"
    pkg_mngs[zypper]="zypper install -y"
    pkg_mngs[pacman]="pacman -S --noconfirm"

    declare -A cron
    cron[apt-get]="cron"
    cron[dnf]="crontabs"
    cron[yum]="crontabs"
    cron[zypper]="cron"
    cron[pacman]="cronie"

    local pkg_mng
    for pm in "${!pkg_mngs[@]}"; do
        if [ -x "$(command -v $pm)" ]; then
            pkg_mng="${pkg_mngs[$pm]}"

            if [[ ! -z "${cron[$pm]}" ]] && [[ $haveCrontab -ne 0 ]]; then
                toInstall+=(${cron[$pm]})
            fi
            break
        fi
    done

    if [[ ! -z $pkg_mng ]] && [[ ${#toInstall[@]} -gt 0 ]]; then
        sudo $pkg_mng ${toInstall[@]}
    fi

    #Check if script not exists
    if [ ! -f "$EXEC" ]; then
        curl -O https://raw.githubusercontent.com/Neilpang/acme.sh/master/acme.sh
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
    if [ ! -d ./ssl ]; then
        mkdir -p ./ssl
    fi

    $EXEC --install-cert -d $DOMAINS \
        --cert-file ./ssl/cert.pem \
        --key-file ./ssl/key.pem \
        --fullchain-file ./ssl/fullchain.pem \
        --reloadcmd "pkill npm && npm start"
}

downloadInstallScript
getCertificate
installCertificate
