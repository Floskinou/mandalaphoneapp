import urllib.request, json, re

results = {}
for plat in ['android', 'ios']:
    req = urllib.request.Request(
        'http://127.0.0.1:8081',
        headers={'expo-platform': plat, 'Accept': 'multipart/mixed,application/expo+json'},
    )
    try:
        raw = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', 'ignore')
    except Exception as e:
        print(plat, 'ERREUR:', e)
        continue
    pattern = r'https://[a-zA-Z0-9.-]+\.exp\.direct[^"\\\s]*'
    urls = list(dict.fromkeys(re.findall(pattern, raw)))
    exp_links = list(dict.fromkeys(re.findall(r'exp://[^"\\\s]+', raw)))
    results[plat] = {'tunnel_urls': urls[:3], 'exp_links': exp_links[:3]}
    print(plat, '=> tunnel:', urls[:3] or 'aucune')
    print('     exp:// :', exp_links[:3] or 'aucun')

with open('qr-url.txt', 'w') as f:
    all_urls = []
    for v in results.values():
        all_urls += v['tunnel_urls']
    f.write(all_urls[0] if all_urls else '')
print('ecrit qr-url.txt :', all_urls[0] if all_urls else '(vide)')
