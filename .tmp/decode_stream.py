import os, json, datetime

base = os.path.join(os.environ.get('TEMP', ''), 'chatgpt-share')
text = open(os.path.join(base, 'chunk_0.txt'), encoding='utf-8').read()
flat = json.loads(text)
print('flat entries:', len(flat))

memo = {}

def deref(i):
    if i in memo:
        return memo[i]
    if not (0 <= i < len(flat)):
        return None
    raw = flat[i]
    if isinstance(raw, bool):
        v = raw
    elif isinstance(raw, int):
        # in a flat-array position an int is a literal number or special code
        v = None if raw < 0 else raw
    else:
        memo[i] = None  # cycle guard
        v = build(raw)
    memo[i] = v
    return v

def build(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, int):
        # in a container position an int is a reference or special code
        return None if v < 0 else deref(v)
    if isinstance(v, str):
        if v.startswith('$@'):
            return None  # unresolved promise
        if v.startswith('\\$'):
            return v[1:]
        return v
    if isinstance(v, float):
        return v
    if isinstance(v, list):
        return [build(x) for x in v]
    if isinstance(v, dict):
        out = {}
        for k, val in v.items():
            if k.startswith('_') and k[1:].isdigit():
                key = deref(int(k[1:]))
                key = str(key)
            else:
                key = k
            out[key] = build(val)
        return out
    return v

root = deref(0)

def find_key(obj, key, path='$'):
    hits = []
    if isinstance(obj, dict):
        for k, val in obj.items():
            if k == key:
                hits.append(path + '.' + k)
            hits.extend(find_key(val, key, path + '.' + k))
    elif isinstance(obj, list):
        for n, val in enumerate(obj):
            hits.extend(find_key(val, key, f'{path}[{n}]'))
    return hits

print('root keys:', list(root.keys()) if isinstance(root, dict) else type(root))
ld = root.get('loaderData', {}) if isinstance(root, dict) else {}
print('loaderData keys:', list(ld.keys()))
for rk, rv in ld.items():
    if isinstance(rv, dict):
        print(f'  {rk} keys: {list(rv.keys())}')

hits = find_key(root, 'linear_conversation')
print('linear_conversation found at:', hits)

with open(os.path.join(base, 'decoded.json'), 'w', encoding='utf-8') as f:
    json.dump(root, f, ensure_ascii=False, indent=1, default=str)
print('decoded.json saved')
