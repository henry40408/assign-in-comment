/* eslint-env jest */

const { assignInComment, extractAssignees } = require('../index')

let robot = { log: jest.fn() }

function mockContext () {
  return {
    config: async () => {},
    payload: {
      action: 'action'
    },
    github: {
      issues: { addAssigneesToIssue: jest.fn() },
      pullRequests: {
        get: jest.fn().mockReturnValue({
          data: { assignees: [], body: '/assign @foo @bar' }
        })
      }
    },
    issue: (body = {}) => ({ ...body, owner: 'owner', repo: 'repo', number: 1 })
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
      data: { assignees: [{ login: 'foo' }], body: '/assign @bar @b-a-z' }
    })
    await assignInComment(robot, context)

    const { addAssigneesToIssue } = context.github.issues
    expect(addAssigneesToIssue).toHaveBeenCalled()
    expect(addAssigneesToIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: ['bar', 'b-a-z', 'foo']
      })
    )
  })

  test('assign unique members', async () => {
    const context = mockContext()
    context.github.pullRequests.get = jest.fn().mockReturnValue({
      data: { assignees: [{ login: 'foo' }], body: '/assign @foo @bar' }
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

describe('extractAssignees', () => {
  const assignees = [{ login: 'foo' }, { login: 'bar' }, { login: 'b-a-z' }]
  const logins = assignees.map(assignee => `${assignee.login}`)

  const body = `the first line
/assign @foo @bar @b-a-z
the second line`

  test('with null body', () => {
    expect(extractAssignees([], null)).toEqual([])
  })

  test('with empty assignees', () => {
    expect(extractAssignees([], body)).toEqual(logins)
  })

  test('with one assignee', () => {
    assignees.forEach(assignee => {
      expect(extractAssignees([assignee], body)).toEqual(logins)
    })
  })

  test('with all assignees', () => {
    expect(extractAssignees(assignees, body)).toEqual(logins)
  })

  test('with empty assignees and empty body', () => {
    expect(extractAssignees([], '')).toEqual([])
  })

  test('with usernames which does not start with @', () => {
    expect(
      extractAssignees([], '/assign @foo @bar please help review thanks')
    ).toEqual(['foo', 'bar'])
  })
})
