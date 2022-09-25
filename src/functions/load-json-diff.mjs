import * as core from '@actions/core'

export function loadJsonDiff() {
  try {
    const jsonDiff = process.env.JSON_DIF

    if (jsonDiff === null || jsonDiff === undefined) {
      core.setFailed('JSON_DIFF is not defined')
    }

    return JSON.parse(jsonDiff)
  } catch (e) {
    core.setFailed(e.message)
  }
}
