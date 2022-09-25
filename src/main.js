import {loadConfig} from './functions/load_config.mjs'

export async function run() {
  const config = loadConfig()
  console.log(config)
}

run()
