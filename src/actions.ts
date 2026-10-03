// Narrow adapter derived from @actions/core 1.11.1 (MIT, GitHub, Inc.).
// Source: https://github.com/actions/toolkit/tree/%40actions/core%401.11.1/packages/core
// See THIRD_PARTY_NOTICES.md. Only the runner operations used here are supported.
import {randomUUID} from 'node:crypto'
import {appendFileSync, existsSync} from 'node:fs'
import {EOL} from 'node:os'

export function getInput(
  name: string,
  options: {required?: boolean} = {}
): string {
  const value =
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || ''
  if (options.required && !value)
    throw new Error(`Input required and not supplied: ${name}`)
  return value.trim()
}
export function getBooleanInput(name: string): boolean {
  const value = getInput(name)
  if (['true', 'True', 'TRUE'].includes(value)) return true
  if (['false', 'False', 'FALSE'].includes(value)) return false
  throw new TypeError(
    `Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
      'Support boolean input list: `true | True | TRUE | false | False | FALSE`'
  )
}
function escape(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}
function command(name: string, value: string): void {
  process.stdout.write(`::${name}::${escape(value)}${EOL}`)
}
export function debug(message: string): void {
  command('debug', message)
}
export function warning(message: string): void {
  command('warning', message)
}
export function error(message: string): void {
  command('error', message)
}
export function info(message: string): void {
  process.stdout.write(message + EOL)
}
export function setFailed(message: string): void {
  process.exitCode = 1
  error(message)
}
export function setOutput(
  name: string,
  value: string | number | string[]
): void {
  const converted = typeof value === 'string' ? value : JSON.stringify(value)
  const file = process.env.GITHUB_OUTPUT
  if (file) {
    const delimiter = `ghadelimiter_${randomUUID()}`
    if (name.includes(delimiter))
      throw new Error(
        `Unexpected input: name should not contain the delimiter "${delimiter}"`
      )
    if (converted.includes(delimiter))
      throw new Error(
        `Unexpected input: value should not contain the delimiter "${delimiter}"`
      )
    if (!existsSync(file)) throw new Error(`Missing file at path: ${file}`)
    appendFileSync(
      file,
      `${name}<<${delimiter}${EOL}${converted}${EOL}${delimiter}${EOL}`,
      'utf8'
    )
  } else {
    const property = escape(name).replace(/:/g, '%3A').replace(/,/g, '%2C')
    process.stdout.write(
      `${EOL}::set-output name=${property}::${escape(converted)}${EOL}`
    )
  }
}
