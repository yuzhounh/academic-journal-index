import { spawnSync } from 'node:child_process';

// Compare with the last successful deployment, so a multi-commit push cannot
// accidentally hide an application change behind its final documentation commit.
const previous = process.env.VERCEL_GIT_PREVIOUS_SHA || '';
if (!/^[a-f0-9]{40}$/.test(previous)) process.exit(1);
const result = spawnSync('git', ['diff', '--quiet', previous, 'HEAD', '--', '.',
  ':!docs/**', ':!results/**', ':!tests/**', ':!README.md'], { stdio: 'ignore' });
// Missing history, a failed Git invocation, and changed runtime inputs all build.
process.exit(result.status === 0 ? 0 : 1);
