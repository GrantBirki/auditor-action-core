import * as core from '@actions/core'

export async function excluded(path, config) {
  if (config?.global_options === null || config?.global_options === undefined) {
    return false
  }

  for (const excludeRule of config.global_options?.exclude_regex || []) {
    const regex = new RegExp(excludeRule, 'g')
    const matches = path.match(regex)

    if (matches) {
      core.debug(
        `skipping excluded path: ${path} - global regex match: ${excludeRule}`
      )
      return true
    }
  }
}
