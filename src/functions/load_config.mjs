import * as core from '@actions/core'
import yaml from 'js-yaml'
import {readFileSync} from 'fs'

export function loadConfig() {
  try {
    core.debug(`Loading config file: ${process.env.CONFIG_PATH}`)
    return yaml.load(readFileSync(process.env.CONFIG_PATH, 'utf8'))
  } catch (e) {
    core.setFailed(e.message)
    process.exit()
  }
}
