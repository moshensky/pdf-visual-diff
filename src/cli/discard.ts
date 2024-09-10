#!/usr/bin/env node

import { CommandModule } from 'yargs'
import { askForConfirmation, findImages } from './utils'
import * as fs from 'fs/promises'

type Arguments = {
  [x: string]: unknown
  path: string
  snapshotsDirName: string
}

export const discard: CommandModule<unknown, Arguments> = {
  command: 'discard',
  describe: 'Discard new snapshots and diffs',
  builder: {
    path: {
      alias: 'p',
      default: '.',
    },
    'snapshots-dir-name': {
      alias: 's',
      default: '__snapshots__',
    },
  },
  handler: ({ path, snapshotsDirName }) => {
    return findImages(path, snapshotsDirName, '*.@(new|diff).png').then((files) => {
      const execDirLength = process.cwd().length
      const filesOutput = files.map((x) => '.' + x.substring(execDirLength)).join('\n')
      return askForConfirmation(`
New snapshots and diff images:          
${filesOutput}
Are you sure you want to remove them all?`).then((overwrite) => {
        if (overwrite) {
          return Promise.all(files.map((x) => fs.unlink(x))).then(() =>
            console.log('Success! New snapshots and diff images removed.'),
          )
        }
        console.log('Command was discarded! No changes were made.')
        return Promise.resolve()
      })
    })
  },
}
