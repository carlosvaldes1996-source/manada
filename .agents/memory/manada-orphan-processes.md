---
    name: Manada repl orphan processes
    description: Deleting old artifact/template directories on disk does not stop their running processes; leftover listeners can break public proxy routing for the current app.
    ---

    When replacing a Replit project's scaffold (e.g. importing a different app via git reset and deleting the old `artifacts/`, `lib/`, `scripts/` template dirs), `rm -rf`ing the directories does NOT stop the processes those old workflows spawned — they keep running detached with cwd shown as "(deleted)" in `ps`/`lsof`.

    **Why:** these orphans (e.g. old "API Server" / mockup-sandbox dev servers) stay bound to ports and can interfere with whatever internal mechanism maps a workflow's port to the public dev-domain proxy — symptom was: `curl localhost:<port>` worked fine and returned 200, but the public `https://<repl>.kirk.replit.dev/` domain hung/timed out (connects TLS, then no HTTP response) intermittently, even though the current webview workflow was healthy. Restarting the current workflow did not fix it.

    **How to apply:** if the public domain stalls/times out while `curl localhost:<port>` on the active workflow succeeds, check `ps aux` / `lsof -i -P -n | grep LISTEN` for node/pnpm processes whose cwd resolves to a deleted path (`readlink /proc/<pid>/cwd` shows "(deleted)"). Kill them (`kill -TERM`, then `-KILL` if needed) rather than just assuming a code bug; then retest the public domain.
    