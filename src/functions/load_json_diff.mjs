import * as core from '@actions/core'
import {readFileSync} from 'fs'

export function loadJsonDiff() {
  try {
    return JSON.parse(readFileSync(process.env.JSON_DIFF_PATH));
  } catch (e) {
    core.setFailed(e.message)
    process.exit();
  }
}
