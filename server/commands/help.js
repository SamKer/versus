module.exports = {
  name: 'help',
  shortcut: ['-h', '--help'],
  usage: 'node console help|-h|--help',
  shortdesc: 'listes les commandes disponbiles',
  fulldesc: 'availables commands in Versus',
  prod: true,

  /**
     * Execute la command
     * @param options
     * @param arguments
     * @param io inputoutput console
     * @param mph Global Instance of 88mph
     */
  async execute (options, arguments, io, vs) {
    io.text(this.fulldesc)
    io.writeln('<fg=yellow>Commands: </>')
    const commands = await vs.commands()
    // order by group
    let g = false
    commands.forEach(c => {
      if (c.group !== g) {
        g = c.group
        io.writeln(`<fg=yellow>${c.group}</>`)
      }
      io.write(`\t<fg=green>${c.name}</>\t${c.shortcut.join('|')}\t\t</>`)
      io.writeln(`${c.shortdesc}`)
    })
  }
}
