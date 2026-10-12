"""PreToolUse guard for the frontend repo.

Blocks reading env/secret files, editing installed or generated files, and
deploying or setting secrets with wrangler from the terminal (deploys go
through Cloudflare Workers Builds from `main`).

Reads the hook payload (JSON) from stdin. Exit 2 blocks the tool call and
shows the stderr message to Claude; exit 0 lets it through.
"""
import json
import os
import re
import sys

# `.env`, `.env.local`, `.env.production`, ... but not `.env.example`; plus wrangler's `.dev.vars`
ENV_FILE = re.compile(r'^(\.env(\.(?!example$)[\w.-]+)?|\.dev\.vars(\.[\w.-]+)?)$')
ENV_IN_COMMAND = re.compile(
    r'(?<![\w.-])(\.env(?:\.(?!example\b)[\w.-]+)?|\.dev\.vars(?:\.[\w.-]+)?)(?![\w.-])'
)
NO_EDIT_DIRS = {'node_modules', 'dist', '.wrangler'}
GENERATED = re.compile(r'(^|[\\/])src[\\/]api[\\/]schema\.d\.ts$')
WRANGLER_DEPLOY = re.compile(r'\bwrangler(@[\w.-]+)?\s+(deploy|publish|versions\s+deploy)\b')
WRANGLER_SECRET = re.compile(r'\bwrangler(@[\w.-]+)?\s+secret\b')


def block(reason):
    print(f'Blocked by .claude/hooks/guard.py: {reason}', file=sys.stderr)
    sys.exit(2)


def parts(path):
    return [p for p in re.split(r'[\\/]+', path) if p]


def main():
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    tool = payload.get('tool_name', '')
    data = payload.get('tool_input') or {}

    if tool == 'Bash':
        command = data.get('command', '')
        if ENV_IN_COMMAND.search(command):
            block('commands must not touch .env*/.dev.vars files. Use .env.example.')
        if WRANGLER_DEPLOY.search(command) and '--dry-run' not in command:
            block('deploys go through Cloudflare Workers Builds from main. Use `wrangler deploy --dry-run` to validate.')
        if WRANGLER_SECRET.search(command):
            block('this app has no runtime secrets; VITE_API_URL is a build variable set in the Cloudflare dashboard.')
        return 0

    path = data.get('file_path') or data.get('path') or ''
    if path and ENV_FILE.match(os.path.basename(path)):
        block(f'{os.path.basename(path)} may hold local values and must not be read or edited. Use .env.example.')
    if tool in ('Edit', 'Write', 'NotebookEdit'):
        if NO_EDIT_DIRS & set(parts(path)):
            block('never edit node_modules/, dist/ or .wrangler/. Reinstall with `npm ci` or rebuild with `npm run build`.')
        if GENERATED.search(path):
            block('src/api/schema.d.ts is generated. Run `npm run gen:api` (see /api-sync).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
