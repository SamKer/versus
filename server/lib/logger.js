const config = require('./config');
const Logger = {

    _debug: config.debug,
    verbosity: config.verbosity,
    reqId: null,


    info: (t, m) => {
        if(typeof m == 'object') {
            m = m.toString();
        }
        if(Logger._debug) {
            console.log(`[INFO][${t}]::`, m);
        }
    },

    log: (t, m) => {
        if(Logger._debug) {
            console.log(`[LOG][reqId:${Logger.reqId}]::`, `${t}::`, m);
        }
    },

    debug: (t, m) => {
            console.log(`[DEBUG][reqId:${Logger.reqId}]::`, `${t}::`, m);
    },

    error: (t, m) => {
        console.error(`[ERROR][reqId:${Logger.reqId}]::`, `${t}::`, m);
    }

};
module.exports = Logger;