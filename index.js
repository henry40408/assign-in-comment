const { assignInComment } = require('./lib')

module.exports = robot => {
  robot.on('pull_request.opened', context => assignInComment(robot, context))
  robot.on('pull_request.edited', context => assignInComment(robot, context))
}
