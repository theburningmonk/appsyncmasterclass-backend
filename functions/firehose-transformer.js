module.exports.handler = async (event) => {
  const output = event.records.map(record => {
    const data = Buffer.from(record.data, 'base64').toString()
    const newData = data + '\n'

    return {
      recordId: record.recordId,
      result: 'Ok',
      data: Buffer.from(newData).toString('base64')
    }
  })

  return { records: output }
}