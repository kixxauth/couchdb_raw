#!/bin/bash
BASE="$(cd `dirname "$0"` && pwd)"

main () {
    local cmd="$1"
    case $cmd in
        'setup')
            shift
            setup "$@"
            ;;
        'test')
            shift
            run_tests "$@"
            ;;
        'clean')
            shift
            clean "$@"
            ;;
        * )
            echo "
Exiting without running any operations.
Possible operations include:

  setup - Install dependencies.
    Usage: ./manage.sh setup

  test  - Run 'setup' and then test.
    Usage: ./manage.sh test <username:password@domain:port>

  clean - Remove everything generated by this script.
    Usage: ./manage.sh clean
            "
            ;;
    esac
}

setup () {
    if ! [ -d "$BASE/node_modules" ]; then
        cd "$BASE/"
        npm install
    fi
}

run_tests () {
    hostname="$1"

    if [ -z "$hostname" ]; then
        echo "<uri> argument is required."
        exit
    fi

    setup
    cd "$BASE/"
    node $BASE/bin/run_tests.js "$hostname" test/
}

clean () {
    rm -rf "$BASE/node_modules/"
}

main "$@"
