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
            setup "$@"
            run_tests "$@"
            ;;
        'clean')
            shift
            clean "$@"
            ;;
        * )
            echo "Exiting without running any operations."
            echo "Possible operations include:"
            echo "  setup - Install dependencies."
            echo "  test - Run 'setup' and then test."
            echo "  clean - Remove everything generated by this script."
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
    cd "$BASE/"
    node test.js
}

clean () {
    rm -rf "$BASE/node_modules/"
}

main "$@"