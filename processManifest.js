const _ = require('lodash')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

module.exports = async function processManifest(manifestData) {
  const stageName = Object.keys(manifestData)
  const { outputs } = manifestData[stageName]

  const getOutputValue = (key) => {
    console.log(`loading output value for [${key}]`)
    const output = _.find(outputs, x => x.OutputKey === key)
    if (!output) {
      throw new Error(`No output found for ${key}`)
    }
    return output.OutputValue
  }

  const dotEnvFile = path.resolve('.env')
  await updateDotEnv(dotEnvFile, {
    API_URL: getOutputValue('AppsyncmasterclassGraphQlApiUrl'),
  })
}

/* Utils, typically this would be a package includes from NPM */
async function updateDotEnv(filePath, env) {
  // Merge with existing values
  try {
    const existing = dotenv.parse(await promisify(fs.readFile)(filePath, 'utf-8'))
    env = Object.assign(existing, env)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }

  const contents = Object.keys(env).map(key => format(key, env[key])).join('\n')
  await promisify(fs.writeFile)(filePath, contents)

  return env
}

function escapeNewlines (str) {
  return str.replace(/\n/g, '\\n')
}

function format (key, value) {
  return `${key}=${escapeNewlines(value)}`
}