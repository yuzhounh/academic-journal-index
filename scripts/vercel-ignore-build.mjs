// Compare with the last successful deployment, so a multi-commit push cannot
// accidentally hide an application change behind its final documentation commit.
const previous = process.env.VERCEL_GIT_PREVIOUS_SHA || '';
const current = process.env.VERCEL_GIT_COMMIT_SHA || '';
const owner = process.env.VERCEL_GIT_REPO_OWNER || 'yuzhounh';
const repository = process.env.VERCEL_GIT_REPO_SLUG || 'academic-journal-index';
if (![previous, current].every(value => /^[a-f0-9]{40}$/.test(value)) ||
    ![owner, repository].every(value => /^[a-zA-Z0-9_.-]+$/.test(value))) process.exit(1);
const ignored = filename => typeof filename === 'string' &&
  (filename === 'README.md' || /^(docs|results|tests)\//.test(filename));
try {
  // The upload allowlist intentionally removes .git; no Git data or token is uploaded.
  const response = await fetch(`https://api.github.com/repos/${owner}/${repository}/compare/${previous}...${current}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'AJI-build-check' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) process.exit(1);
  const comparison = await response.json();
  if (comparison.status === 'identical') process.exit(0);
  // GitHub caps unpaginated comparisons; ambiguous/truncated history must build.
  if (comparison.status !== 'ahead' || !Array.isArray(comparison.files) ||
      comparison.files.length >= 300 || comparison.total_commits > 250) process.exit(1);
  process.exit(comparison.files.every(file => ignored(file.filename) &&
    (!file.previous_filename || ignored(file.previous_filename))) ? 0 : 1);
} catch {
  // API/rate-limit/network failures remain an ordinary build, never a missed update.
  process.exit(1);
}
