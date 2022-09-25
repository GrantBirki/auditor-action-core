import * as core from '@actions/core'
import yaml from 'js-yaml'
import {readFileSync} from 'fs'

export function loadConfig() {
  try {
    return yaml.load(readFileSync("config/auditor-sample.yml", 'utf8'))
    // return yaml.load(readFileSync(process.env.CONFIG, 'utf8'))
  } catch (e) {
    core.setFailed(e.message)
    process.exit();
  }
}
