const { log, assignInComment, assignInPullRequest } = require('./lib')

module.exports = robot => {
  log(robot, 'assign-in-comment bot is on!')
  robot.on('pull_request.opened', context => assignInPullRequest(robot, context))
  robot.on('pull_request.edited', context => assignInPullRequest(robot, context))
  robot.on('issue_comment.created', context => assignInComment(robot, context))
}
