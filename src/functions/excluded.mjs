import * as core from '@actions/core'

export async function excluded(rule, path) {
  // if the exclude rule is not define, return false as we are not excluding anything
  if (rule?.exclude_regex === null || rule?.exclude_regex === undefined) {
    return false
  }

  for (const excludeRule of rule?.exclude_regex || []) {
    const regex = new RegExp(excludeRule, 'g')
    const matches = path.match(regex)

    if (matches) {
      // if there is a match, the file is excluded
      core.debug(
        `skipping excluded path: ${path} - individual rule regex match: ${excludeRule}`
      )
      return true
    }
  }

  // if we get here, the file is not excluded
  return false
}
