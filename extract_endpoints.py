import os, re
p = re.compile(r'(?:fetchApi|getApi|postApi|putApi|deleteApi)\([\'"`]([^\'"`]+)[\'"`]')
res = set()
for root, _, files in os.walk('frontend/src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            try:
                with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                    content = file.read()
                    matches = p.findall(content)
                    for m in matches:
                        res.add(m)
            except Exception as e:
                pass

for endpoint in sorted(list(res)):
    print(endpoint)
