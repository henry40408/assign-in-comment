/* eslint-env jest */

const { assignInComment } = require('../../index')

const robot = { log: jest.fn() }

function mockContext () {
  return {
    config: async () => {},
    payload: {
      action: 'action'
    },
    github: {
      issues: {
        addAssigneesToIssue: jest.fn()
      },
      pullRequests: {
        get: jest.fn().mockReturnValue({
          data: { assignees: [], body: 'assign @foo @bar' }
        })
      }
    },
    issue: (body = {}) =>
      Object.assign({}, { owner: 'owner', repo: 'repo', number: 1 }, body)
  }
}

describe('assignInComment', () => {
  test('assign who are not assigned to be assignees', async () => {
    const context = mockContext()
    await assignInComment(robot, context)

    const { addAssigneesToIssue } = context.github.issues
    expect(addAssigneesToIssue).toHaveBeenCalled()
    expect(addAssigneesToIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: ['foo', 'bar']
      })
    )
  })

  test('union who are not assigned and already assigned', async () => {
    const context = mockContext()
    context.github.pullRequests.get = jest.fn().mockReturnValue({
      data: { assignees: ['foo'], body: 'assign @bar @baz' }
    })
    await assignInComment(robot, context)

    const { addAssigneesToIssue } = context.github.issues
    expect(addAssigneesToIssue).toHaveBeenCalled()
    expect(addAssigneesToIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: ['bar', 'baz', 'foo']
      })
    )
  })

  test('assign unique members', async () => {
    const context = mockContext()
    context.github.pullRequests.get = jest.fn().mockReturnValue({
      data: { assignees: ['foo'], body: 'assign @foo @bar' }
    })
    await assignInComment(robot, context)

    const { addAssigneesToIssue } = context.github.issues
    expect(addAssigneesToIssue).toHaveBeenCalled()
    expect(addAssigneesToIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: ['foo', 'bar']
      })
    )
  })
})
