import json

import os
base = os.path.join(os.environ.get('TEMP', ''), 'chatgpt-share')
html = open(os.path.join(base, 'page.html'), encoding='utf-8', errors='replace').read()

marker = 'self.__next_f.push([1,"'
out = []
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
    literal = ''.join(buf)
    try:
        out.append(json.loads('"' + literal + '"'))
    except Exception:
        pass
    i = k

payload = ''.join(out)
open(os.path.join(base, 'payload.txt'), 'w', encoding='utf-8').write(payload)
print('payload bytes:', len(payload))
idx = payload.find('linear_conversation')
print('linear_conversation at:', idx)
print('--- context before ---')
print(payload[max(0, idx-400):idx])
print('--- context after ---')
print(payload[idx:idx+600])
