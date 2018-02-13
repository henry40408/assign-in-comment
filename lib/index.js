let { chain, concat, startsWith } = require('lodash')

function log (robot, message) {
  return robot.log(`[assign-in-comment] ${message}`)
}

function reduceUsernames (acc, line) {
  if (!startsWith(line, '/assign')) {
    return acc
  }

  let usernames = line
    .replace(/^\/assign\s+/, '')
    .trim()
    .split(/\s+/)
    .map(username => username.replace(/^@/, ''))

  return concat(acc, usernames)
}

async function assignInComment (robot, context) {
  let { event, payload: { action }, github } = context
  log(robot, `responds to ${event}.${action}`)

  let issue = context.issue()
  let pullRequest = await github.pullRequests.get(issue)

  let { assignees, body } = pullRequest.data
  let newAssignees = extractAssignees(assignees, body)

  let assigneeList = newAssignees.join(', ')
  let { owner, repo, number } = issue
  log(robot, `assign [${assigneeList}] to ${owner}/${repo}#${number}`)

  let params = context.issue({ assignees: newAssignees })
  return github.issues.addAssigneesToIssue(params)
}

exports.assignInComment = assignInComment

function extractAssignees (assignees, body = '') {
  let lines = body.split(/\n/).map(line => line.trim())

  return chain(lines)
    .reduce(reduceUsernames, [])
    .union(assignees)
    .uniq()
    .value()
}

exports.extractAssignees = extractAssignees
