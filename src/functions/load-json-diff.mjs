import * as core from '@actions/core'

export function loadJsonDiff() {
  try {
    const jsonDiff = process.env.JSON_DIFF

    if (jsonDiff === null || jsonDiff === undefined) {
      core.setFailed('JSON_DIFF is not defined')
      process.exit();
    }

    return JSON.parse(jsonDiff)
  } catch (e) {
    core.setFailed(e.message)
    process.exit();
  }
}