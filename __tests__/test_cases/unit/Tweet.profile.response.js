const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('Tweet.profile.response template', () => {
  it("Should set __typename as 'MyProfile' for current user", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Tweet.profile.response.vtl')

    const username = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id: username })
    const result = when.we_invoke_an_appsync_template(templatePath, context)

    expect(result).toEqual({
      id: username,
      __typename: 'MyProfile'
    })
  })

  it("Should set __typename as 'OtherProfile' for other users", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Tweet.profile.response.vtl')

    const username = chance.guid()
    const id = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id })
    const result = when.we_invoke_an_appsync_template(templatePath, context)

    expect(result).toEqual({
      id,
      __typename: 'OtherProfile'
    })
  })
})