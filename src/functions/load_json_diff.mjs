import * as core from '@actions/core'
import {readFileSync} from 'fs'

export function loadJsonDiff() {
  try {
    const jsonDiffPath = core.getInput('json_diff_path', {required: true})
    core.debug(`Loading JSON diff from ${jsonDiffPath}`)
    const raw = readFileSync(jsonDiffPath)

    // if the json diff file contents are empty, warn and exit
    if (raw.length === 0 || raw === undefined || raw === null) {
      core.warning(`JSON diff file is empty - file: ${jsonDiffPath}`)
      process.exit(0)
    }

    const diff = JSON.parse(raw)

    // log the entire diff for debug purposes
    core.debug(`========== JSON DIFF ==========`)
    core.debug(JSON.stringify(diff))
    core.debug(`===============================`)

    return diff
  } catch (e) {
    core.setFailed(e.message)
    process.exit(1)
  }
}
