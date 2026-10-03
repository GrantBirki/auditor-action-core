import type {Config} from '../types.js'
import * as core from '../actions.js'
import yaml from 'js-yaml'
import {readFileSync} from 'node:fs'

export function loadConfig() {
  try {
    const configPath = core.getInput('config_path', {required: true})
    core.debug(`Loading config file: ${configPath}`)
    return yaml.load(readFileSync(configPath, 'utf8')) as Config
  } catch (e) {
    core.setFailed(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}
