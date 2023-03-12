import { spawnSync } from 'child_process';
import os from 'os';

const platform = os.platform();

interface Commands {
  [platform: string]: {
    cmd: string;
    args: string[];
  };
}

const commands: Commands = {
  linux: { cmd: 'netstat', args: ['-a', '-n'] },
  darwin: { cmd: 'netstat', args: ['-a', '-n'] },
  win32: { cmd: 'netstat', args: ['-a', '-n'] },
};

function findPortsInUse(): number[] {
  const ports: Set<number> = new Set();
  const { cmd, args } = commands[platform];
  const proc = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf-8' });
  if (proc.stderr) {
    console.error(Error(proc.stderr));
  }
  if (proc.output) {
    proc.output.forEach((output) => {
      if (output) {
        output.split('\n').forEach((line) => {
          // status LISTEN only
          if (line.indexOf('LISTEN') > -1) {
            // get local port only
            // win32: *:8000
            // darwin/linux: *.8000
            const matcher = /[:.](\d+)\s/.exec(line);
            if (matcher?.[1]) {
              const port = Number(matcher[1]);
              // get ports in range
              if (port >= 1025 && port <= 65535) {
                ports.add(port);
              }
            }
          }
        });
      }
    });
  }
  return Array.from(ports);
}

export default findPortsInUse;
