module.exports = {
  name: 'version',
  shortcut: ['--version'],
  usage: 'node console version',
  shortdesc: 'Get Version',
  fulldesc: 'get Version project',
  prod: true, // set to false if you don't wantthe command on prod env

  /**
     * run command
     * @param options {'-o':'option'}
     * @param arguments [args]
     * @param io inputoutput console SymfonyStyleIO
     * @param mph Global Instance of 88mph
     * @return null;
     */
  execute (options, arguments, io, vs) {
    io.writeln(`<fg=green>Version: ${vs.version}`)
    return null
  },

  /**
     *
     * @param io inputoutput console SymfonyStyleIO
     * @return null;
     */
  showUsage (io) {
    io.writeln('showing usage for your command')
    return null
  }
}
