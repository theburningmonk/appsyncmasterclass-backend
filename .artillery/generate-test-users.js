const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const given = require('../__tests__/steps/given')
const fs = require('fs')

if (!argv.count) {
  throw new Error('must specify "count", e.g. --count=100')
}

if (argv.count < 1) {
  throw new Error('"count" must be at least 1, e.g. --count=100')
}

const run = async () => {
  const users = []
  for (let i = 0; i < argv.count; i++) {
    const user = await given.an_authenticated_user()
    users.push(user)
  }

  const csv = users.map(x => x.idToken).join('\n')
  fs.writeFileSync('./.artillery/users.csv', csv)
}

run().then(_ => console.log('all done'))