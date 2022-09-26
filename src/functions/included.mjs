import * as core from '@actions/core'

export async function included(rule, path) {
  // if the include rule is not defined, return true as we will include by default
  if (rule?.include_regex === null || rule?.include_regex === undefined) {
    return true
  }

  for (const includeRule of rule?.include_regex || []) {
    const regex = new RegExp(includeRule, 'g')
    const matches = path.match(regex)

    if (matches) {
      // if there is a match, the file is explicitly included
      core.debug(
        `explicitly including path: ${path} - individual rule regex match: ${includeRule}`
      )
      return true
    }
  }

  // if we get here, the file is not explicitly included
  return false
}
