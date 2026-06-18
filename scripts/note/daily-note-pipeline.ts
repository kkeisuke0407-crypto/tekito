import { spawn } from 'node:child_process';

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function main() {
  const selection = (process.env.NOTE_KEYWORD_SELECTION || 'google').toLowerCase();
  if (selection === 'google') {
    await run('npx', ['tsx', 'scripts/note/select-google-keywords-browser.ts']);
  } else if (selection === 'browser' || selection === 'rakko-browser') {
    await run('npx', ['tsx', 'scripts/note/select-rakko-keywords-browser.ts']);
  } else if (selection === 'api') {
    await run('npx', ['tsx', 'scripts/note/select-rakko-keywords.ts']);
  } else {
    console.log('[note:daily] keyword selection skipped');
  }
  await run('npx', ['tsx', 'scripts/note/generate-note-article.ts']);
  await run('npx', ['tsx', 'scripts/note/check-note-quality.ts']);
  await run('npx', ['tsx', 'scripts/note/publish-note.ts']);
}

main().catch((err) => {
  console.error('[note:daily] failed:', err);
  process.exit(1);
});
