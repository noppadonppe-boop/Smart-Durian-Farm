const path = require('node:path')

const { configstore } = require('firebase-tools/lib/configstore')

process.env.NO_UPDATE_NOTIFIER = '1'

configstore.path = path.resolve(
  process.cwd(),
  '.firebase-local',
  'configstore',
  'firebase-tools.json',
)

require('firebase-tools/lib/bin/firebase.js')
