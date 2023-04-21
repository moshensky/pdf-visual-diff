import { glob } from 'glob'
import { join } from 'path'
import { createInterface } from 'readline'

const suffixLen = '.new.png'.length

export const mkCurrentSnapshotPath = (newSnapshotPath: string): string =>
  newSnapshotPath.substring(0, newSnapshotPath.length - suffixLen) + '.png'

export const mkDiffSnapshotPath = (newSnapshotPath: string): string =>
  newSnapshotPath.substring(0, newSnapshotPath.length - suffixLen) + '.diff.png'

export const askForConfirmation = (question: string): Promise<boolean> => {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((res) => {
    readline.question(question + ' [Y/n]: ', (answer) => {
      readline.close()
      const cleaned = answer.trim().toLocaleLowerCase()
      if (cleaned === '' || ['yes', 'y'].indexOf(cleaned) >= 0) {
        res(true)
      } else if (['no', 'n'].indexOf(cleaned) >= 0) {
        res(false)
      } else {
        process.stdout.write('\nInvalid Response. Please answer with yes(y) or no(n)\n\n')
        askForConfirmation(question).then(res)
      }
    })
  })
}

export const findImages = (
  startingPath = '.',
  snapshotsDirName = '__snapshots__',
  filenamePatter = '*.new.png',
): Promise<ReadonlyArray<string>> => {
  const pattern = join(process.cwd(), startingPath, '**', snapshotsDirName, filenamePatter)
  return glob(pattern, {})
}
