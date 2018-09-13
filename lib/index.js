let { chain, concat } = require('lodash')

function log (robot, message) {
  return robot.log(`[assign-in-comment] ${message}`)
}

exports.log = log

function usernameReducer (acc, line) {
  let prefix = /^\/(assign|handover)\s+/

  if (!prefix.test(line)) {
    return acc
  }

  let usernames = line
    .replace(prefix, '')
    .trim()
    .split(/\s+/)
    .filter(login => login.startsWith('@'))
    .map(username => username.replace(/^@/, ''))

  return concat(acc, usernames)
}

async function assignInComment (robot, context) {
  let { event, github, payload, payload: { action } } = context
  log(robot, `responds to ${event}.${action}`)

  if (!payload.comment) {
    return
  }

  let { comment: { id: commentId } } = payload
  let params = context.issue({ comment_id: commentId })

  let {
    data: {
      body,
      user: {
        login: commentAuthor
      }
    }
  } = await context.github.issues.getComment(params)
  log(robot, `remove comment author: ${commentAuthor}`)

  let removeParams = context.issue({ assignees: [commentAuthor] })
  await github.issues.removeAssigneesFromIssue(removeParams)

  let newAssignees = extractAssignees([], body)
  log(robot, `assign new assignees: [${newAssignees.join(', ')}]`)
  let addParams = context.issue({ assignees: newAssignees })
  await github.issues.addAssigneesToIssue(addParams)
}

exports.assignInComment = assignInComment

async function assignInPullRequest (robot, context) {
  let { event, github, payload: { action } } = context
  log(robot, `responds to ${event}.${action}`)

  let issue = context.issue()

  let { data: { assignees, body } } = await github.pullRequests.get(issue)
  let newAssignees = extractAssignees(assignees, body)

  let assigneesList = newAssignees.join(', ')
  let { owner, repo, number } = issue
  log(robot, `assign [${assigneesList}] to ${owner}/${repo}#${number}`)

  let params = context.issue({ assignees: newAssignees })
  await github.issues.addAssigneesToIssue(params)
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
