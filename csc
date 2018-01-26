#!/usr/bin/env bash

# init
readonly envFile='.env'
readonly binServerless='sls'

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

# Parameters reading :
while [ ! -z $1 ]; do
    case "$1" in
        --deploy) cmdDeploy=1 ;;
        --inv) cmdInvoke=1 ;;
        --invl) cmdInvokeLocal=1 ;;
        -h|--help) usage ;;
        *) echo "> Wrong options, just check the usage"; usage ;;
    esac
    shift
done

#
# Business logic here
#

if [[ ${cmdDeploy} -eq 1 ]]; then
    ${binServerless} deploy && \
    ssh -L 8080:${ES_ENDPOINT_DEV}:80 root@${ES_ALLOW_IP} -N
fi

if [[ ${cmdInvoke} -eq 1 ]]; then
    ${binServerless} invoke -f cscraper
fi

if [[ ${cmdInvokeLocal} -eq 1 ]]; then
    ${binServerless} invoke local -f cscraper
fi
