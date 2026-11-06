import os, json

base = os.path.join(os.environ.get('TEMP', ''), 'chatgpt-share')
html = open(os.path.join(base, 'page.html'), encoding='utf-8', errors='replace').read()

marker = '.streamController.enqueue("'
chunks = []
i = 0
while True:
    j = html.find(marker, i)
    if j == -1:
        break
    k = j + len(marker)
    buf = []
    while k < len(html):
        c = html[k]
        if c == '\\' and k + 1 < len(html):
            buf.append(html[k:k+2])
            k += 2
            continue
        if c == '"':
            break
        buf.append(c)
        k += 1
    try:
        chunks.append(json.loads('"' + ''.join(buf) + '"'))
    except Exception as e:
        print('chunk decode failed:', e)
    i = k

print('num chunks:', len(chunks))
for n, ch in enumerate(chunks):
    print(f'--- chunk {n}: {len(ch)} chars, head: {ch[:80]!r}, tail: {ch[-80:]!r}')
    with open(os.path.join(base, f'chunk_{n}.txt'), 'w', encoding='utf-8') as f:
        f.write(ch)
