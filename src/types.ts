// Input contracts documented by auditor-action. Parsing remains runtime-compatible.
export interface Rule {
  name: string
  type: string
  pattern: string
  message: string
  include_regex?: string[] | null
  exclude_regex?: string[] | null
  requested_reviewers?: string[]
}

export interface Config {
  rules: Rule[]
  global_options?: {
    alert_level?: string
    comment_on_pr?: boolean
    request_reviewers?: boolean
    exclude_auditor_config?: boolean
    labels?: string[]
    exclude_regex?: string[]
  } | null
}

export interface Diff {
  files?:
    | {
        type: string
        path?: string
        pathAfter?: string
        chunks?:
          | {
              changes?:
                | {type: string; content: string; lineAfter: number}[]
                | null
            }[]
          | null
      }[]
    | null
}

export interface Annotation {
  path: string
  start_line: number
  end_line: number
  annotation_level: 'failure' | 'warning'
  message: string
}

export interface Results {
  report: boolean
  message: string
  counter: number
  annotations: Annotation[]
  requested_reviewers: string[]
  // Existing processResults callers can opt into a failing exit status.
  fail?: boolean
}
