import {loadConfig} from './functions/load_config.mjs'
import {loadJsonDiff} from './functions/load_json_diff.mjs'

export async function run() {
  const config = loadConfig()
  const diff = loadJsonDiff()
  console.log(config)
  console.log(diff)
}

run()
