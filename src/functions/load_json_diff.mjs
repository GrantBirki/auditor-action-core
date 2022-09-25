import * as core from '@actions/core'
import {readFileSync} from 'fs'

export function loadJsonDiff() {
  try {
    const raw = readFileSync(process.env.JSON_DIFF_PATH)

    // if the json diff file contents are empty, warn and exit
    if (raw.length === 0) {
      core.warning(
        `JSON diff file is empty - file: ${process.env.JSON_DIFF_PATH}`
      )
      process.exit(0)
    }

    return JSON.parse(raw)
  } catch (e) {
    core.setFailed(e.message)
    process.exit()
  }
}
