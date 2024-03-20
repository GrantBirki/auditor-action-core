import * as core from '@actions/core'
import yaml from 'js-yaml'
import {readFileSync} from 'fs'

export function loadConfig() {
  try {
    const configPath = core.getInput('config_path', {required: true})
    core.debug(`Loading config file: ${configPath}`)
    return yaml.load(readFileSync(configPath, 'utf8'))
  } catch (e) {
    core.setFailed(e.message)
    process.exit(1)
  }
}
