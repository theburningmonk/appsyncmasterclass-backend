const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('hydrateFollowing.request template', () => {
  it("Should return empty array if prev.result.relationships is empty", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/hydrateFollowing.request.vtl')

    const username = chance.guid()
    const prev = {
      result: {
        relationships: []
      }
    }
    const context = given.an_appsync_context({ username }, {}, {}, {}, {}, prev)
    const result = when.we_invoke_an_appsync_template(templatePath, context)

    expect(result).toEqual({
      profiles: []
    })
  })

  it("Should convert relationships to BatchGetItem keys", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/hydrateFollowing.request.vtl')

    const username = chance.guid()
    const userId = chance.guid()
    const otherUserId = chance.guid()
    const relationships = [{
      userId,
      sk: `FOLLOWS_${otherUserId}`,
      otherUserId
    }]
    const prev = {
      result: {
        relationships
      }
    }
    const context = given.an_appsync_context({ username }, {}, {}, {}, {}, prev)
    const result = when.we_invoke_an_appsync_template(templatePath, context)

    expect(result).toEqual({
      "version" : "2018-05-29",
      "operation" : "BatchGetItem",
      "tables" : {
        "${UsersTable}": {
          "keys": [{
            "id": {
              "S": otherUserId
            }
          }],
          "consistentRead": false
        }
      }
    })
  })
})