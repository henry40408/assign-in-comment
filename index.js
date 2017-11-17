const { chain, concat } = require('lodash')

const pattern = /^assign\s+((\s*(?:@\w+))*)$/

module.exports = robot => {
  robot.on('pull_request.opened', context => assignInComment(robot, context))
  robot.on('pull_request.edited', context => assignInComment(robot, context))
}

async function assignInComment (robot, context) {
  const { event, payload: { action }, github } = context
  robot.log(`responds to ${event}.${action}`)

  const issue = context.issue()
  const pullRequest = await github.pullRequests.get(issue)

  const { assignees, body } = pullRequest.data
  const newAssignees = extractAssignees(assignees, body)

  const assigneeList = newAssignees.join(', ')
  const { owner, repo, number } = issue
  robot.log(`assign [${assigneeList}] to ${owner}/${repo}#${number}`)

  const params = context.issue({ assignees: newAssignees })
  return github.issues.addAssigneesToIssue(params)
}

module.exports.assignInComment = assignInComment

function extractAssignees (assignees, body) {
  const lines = body.split(/\n/).map(line => line.trim())

  return chain(lines)
    .reduce((acc, line) => {
      const matches = pattern.exec(line)

      if (matches && matches.length >= 2) {
        const usernames = matches[1]
          .split(/\s+/)
          .map(username => username.replace(/^@/, ''))

        return concat(acc, usernames)
      }

      return acc
    }, [])
    .union(assignees)
    .uniq()
    .value()
}

module.exports.extractAssignees = extractAssignees
