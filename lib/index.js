let { chain, concat, startsWith } = require('lodash')

function log (robot, message) {
  return robot.log(`[assign-in-comment] ${message}`)
}

exports.log = log

function usernameReducer (acc, line) {
  if (!startsWith(line, '/assign')) {
    return acc
  }

  let usernames = line
    .replace(/^\/assign\s+/, '')
    .trim()
    .split(/\s+/)
    .filter(login => login.startsWith('@'))
    .map(username => username.replace(/^@/, ''))

  return concat(acc, usernames)
}

async function assignInPullRequest (robot, context) {
  let { event, payload: { action }, github } = context
  log(robot, `responds to ${event}.${action}`)

  let issue = context.issue()
  let pullRequest = await github.pullRequests.get(issue)

  let { assignees, body } = pullRequest.data
  let newAssignees = extractAssignees(assignees, body)

  let { owner, repo, number } = issue
  log(robot, `assign [${newAssignees}] to ${owner}/${repo}#${number}`)

  let params = context.issue({ assignees: newAssignees })
  return github.issues.addAssigneesToIssue(params)
}

exports.assignInPullRequest = assignInPullRequest

function extractAssignees (assignees, body = '') {
  if (!body) {
    // body might be null
    return []
  }

  let lines = body.split(/\n/).map(line => line.trim())

  return chain(lines)
    .reduce(usernameReducer, [])
    .union(assignees.map(assignee => `${assignee.login}`))
    .uniq()
    .value()
}

exports.extractAssignees = extractAssignees
