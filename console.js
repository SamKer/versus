/**
 * Command runner
 *
 */
const Versus = require('./server/versus');
const vs = new Versus('command');
const io = vs.io;

io.title(`${vs.project} Projects`);
vs.handleCommand(process.argv);
