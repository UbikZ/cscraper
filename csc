#!/usr/bin/env bash

# init
readonly envFile='.env'

# Usage
usage () {
    echo ""
    echo "  usage: cscraper.sh [--deploy] [--inv] [--invl]"
    echo ""
    exit 1
}

# No param
[ "$1" == "" ] && usage

# No env file
if [ -f "${envFile}" ]; then
    source "${envFile}"
else
    echo "No '.env' file. Abort."
    exit 1
fi

# Cmd handler
cmdDeploy=0
cmdInvoke=0
cmdInvokeLocal=0
cmdTunnel=0

# Parameters reading :
while [ ! -z $1 ]; do
    case "$1" in
        --deploy) cmdDeploy=1 ;;
        --inv) cmdInvoke=1 ;;
        --invl) cmdInvokeLocal=1 ;;
        --tunnel) cmdTunnel=1 ;;
        -h|--help) usage ;;
        *) echo "> Wrong options, just check the usage"; usage ;;
    esac
    shift
done

function deploy() {
    ${binServerless} deploy
}

function tunnel() {
    local destPort=8080
    open "http://localhost:${destPort}/_plugin/kibana"
    ssh -L ${destPort}:${ES_ENDPOINT_DEV}:80 root@${ES_ALLOW_IP} -N
}

function invoke() {
    local arg='local'
    [ -z $1 ] && local arg=''
    serverless invoke ${arg} -f cscraper
}

#
# Business logic here
#

if [[ ${cmdDeploy} -eq 1 ]]; then
    deploy && tunnel
fi

if [[ ${cmdTunnel} -eq 1 ]]; then
    tunnel
fi

if [[ ${cmdInvoke} -eq 1 ]]; then
    invoke
fi

if [[ ${cmdInvokeLocal} -eq 1 ]]; then
    invoke 'local'
fi
