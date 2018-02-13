const { log, assignInComment } = require('./lib')

module.exports = robot => {
  log(robot, 'assign-in-comment bot is on!')
  robot.on('pull_request.opened', context => assignInComment(robot, context))
  robot.on('pull_request.edited', context => assignInComment(robot, context))
}
