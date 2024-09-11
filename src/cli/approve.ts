#!/usr/bin/env node

import { CommandModule } from 'yargs'
import * as fs from 'fs/promises'
import { askForConfirmation, findImages, mkCurrentSnapshotPath, mkDiffSnapshotPath } from './utils'

type Arguments = {
  [x: string]: unknown
  path: string
  snapshotsDirName: string
}

export const approve: CommandModule<unknown, Arguments> = {
  command: 'approve',
  describe: 'Approve new snapshots',
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
    return findImages(path, snapshotsDirName).then((files) => {
      const execDirLength = process.cwd().length
      const filesOutput = files.map((x) => '.' + x.substring(execDirLength)).join('\n')
      return askForConfirmation(`
New snapshots:          
${filesOutput}
Are you sure you want to overwrite current snapshots?`).then((overwrite) => {
        if (overwrite) {
          return Promise.all(
            files.map((x) =>
              fs.rename(x, mkCurrentSnapshotPath(x)).then(() => fs.unlink(mkDiffSnapshotPath(x))),
            ),
          ).then(() => console.log('Success! Snapshots are overwritten.'))
        }
        console.log('Command was discarded! No changes were made.')
        return Promise.resolve()
      })
    })
  },
}
