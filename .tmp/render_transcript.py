import os, json, datetime

base = os.path.join(os.environ.get('TEMP', ''), 'chatgpt-share')
root = json.load(open(os.path.join(base, 'decoded.json'), encoding='utf-8'))

route = root['loaderData']['routes/share.$shareId.($action)']
data = route['serverResponse']['data']
conv = data['linear_conversation']

print('nodes:', len(conv))
print('top-level data keys:', list(data.keys()))
meta = data.get('conversation', {})
print('conversation title:', meta.get('title'))
print('conversation create_time:', meta.get('create_time'))
print()

def fmt_ts(ts):
    if not ts:
        return ''
    try:
        return datetime.datetime.fromtimestamp(float(ts), datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    except Exception:
        return str(ts)

def render_content(content):
    if not isinstance(content, dict):
        return ''
    ct = content.get('content_type', '')
    if ct == 'text':
        parts = content.get('parts', [])
        return '\n'.join(p for p in parts if isinstance(p, str))
    if ct == 'code':
        lang = content.get('language', '')
        return f"```{lang}\n{content.get('text','')}\n```"
    if ct in ('execution_output',):
        return f"[output]\n{content.get('text','')}"
    return f'[content_type: {ct}]'

lines = []
for n, node in enumerate(conv):
    if not isinstance(node, dict):
        continue
    msg = node.get('message')
    if not isinstance(msg, dict):
        continue
    author = msg.get('author', {})
    role = author.get('role', '?')
    name = author.get('name', '')
    recipient = msg.get('recipient', '')
    ts = fmt_ts(msg.get('create_time'))
    body = render_content(msg.get('content'))
    if not body.strip():
        continue
    label = role + (f' ({name})' if name else '')
    lines.append(f'## [{n}] {label}  {ts}')
    lines.append(body)
    lines.append('')

out = '\n'.join(lines)
with open(os.path.join(base, 'transcript.md'), 'w', encoding='utf-8') as f:
    f.write(out)
print('transcript chars:', len(out))
