/* eslint-env jest */

const { extractAssignees } = require('../../index')

describe('extractAssignees', () => {
  const assignees = ['foo', 'bar', 'baz']

  const body = `the first line
  
assign @foo @bar @baz

the second line`

  test('with empty assignees', () => {
    expect(extractAssignees([], body)).toEqual(assignees)
  })

  test('with one assignee', () => {
    assignees.forEach(assignee => {
      expect(extractAssignees([assignee], body)).toEqual(assignees)
    })
  })

  test('with all assignees', () => {
    expect(extractAssignees(assignees, body)).toEqual(assignees)
  })
})
