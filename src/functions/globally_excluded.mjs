import * as core from '@actions/core'

export async function globallyExcluded(path, config) {
  // if the exclude rule is not define, return false as we are not excluding anything
  if (config?.global_options === null || config?.global_options === undefined) {
    return false
  }

  for (const excludeRule of config.global_options?.exclude_regex || []) {
    const regex = new RegExp(excludeRule, 'g')
    const matches = path.match(regex)

    if (matches) {
      // if there is a match, the file is excluded
      core.debug(
        `skipping excluded path: ${path} - global regex match: ${excludeRule}`
      )
      return true
    }
  }

  // if we get here, the file is not excluded
  return false
}
