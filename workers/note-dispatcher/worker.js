export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dispatchNoteWorkflow(env, 'cron'));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/dispatch') {
      return new Response('Not found', { status: 404 });
    }

    const token = request.headers.get('x-dispatch-token');
    if (env.DISPATCH_TOKEN && token !== env.DISPATCH_TOKEN) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }

    return dispatchNoteWorkflow(env, 'manual');
  },
};

async function dispatchNoteWorkflow(env, source) {
  const owner = env.GITHUB_OWNER || 'kkeisuke0407-crypto';
  const repo = env.GITHUB_REPO || 'tekito';
  const workflow = env.GITHUB_WORKFLOW_FILE || 'daily-note-publish.yml';
  const ref = env.GITHUB_REF || 'main';

  if (!env.GITHUB_TOKEN) {
    return json({ ok: false, error: 'missing GITHUB_TOKEN' }, 500);
  }

  const endpoint = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'note-dispatcher-worker',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      ref,
      inputs: {
        source,
        dispatched_at: new Date().toISOString(),
      },
    }),
  });

  if (response.status === 204) {
    return json({ ok: true, source, owner, repo, workflow, ref, dispatched_at: new Date().toISOString() });
  }

  const body = await response.text();
  return json(
    {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      body,
    },
    500,
  );
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
