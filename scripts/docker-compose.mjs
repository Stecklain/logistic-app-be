import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(currentDir, '..')

function toWindowsPath(inputPath) {
  if (!inputPath.startsWith('/mnt/')) {
    return inputPath
  }

  const driveLetter = inputPath[5]
  const remainder = inputPath.slice(6).replaceAll('/', '\\')
  return `${driveLetter.toUpperCase()}:\\${remainder}`
}

function resolveDockerCommand() {
  if (process.platform === 'win32') {
    return { command: 'docker' }
  }

  const dockerDesktopPath = '/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe'
  if (existsSync(dockerDesktopPath)) {
    return { command: dockerDesktopPath }
  }

  return { command: 'docker' }
}

const [composeFileName, ...extraArgs] = process.argv.slice(2)

if (!composeFileName || extraArgs.length === 0) {
  console.error('Uso: node ./scripts/docker-compose.mjs <compose-file> <compose-args>')
  process.exit(1)
}

const composeFile = path.resolve(repoRoot, composeFileName)
const { command } = resolveDockerCommand()
const composeFilePath = process.platform === 'win32' ? composeFile : toWindowsPath(composeFile)

const result = spawnSync(command, ['compose', '-f', composeFilePath, ...extraArgs], {
  cwd: repoRoot,
  stdio: 'inherit',
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 0)
