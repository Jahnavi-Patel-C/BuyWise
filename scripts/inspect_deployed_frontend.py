import urllib.request, ssl, re

ctx = ssl.create_default_context()
url = 'https://frontend-psi-weld-u5xxyzg6a6.vercel.app/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
        html = r.read().decode('utf-8')
        print('HTML status:', r.status)
        js_files = re.findall(r'src="(/assets/[^"]+\.js)"', html)
        print('JS assets:', js_files)
        for js in js_files:
            js_url = 'https://frontend-psi-weld-u5xxyzg6a6.vercel.app' + js
            with urllib.request.urlopen(js_url, timeout=15, context=ctx) as js_r:
                js_content = js_r.read().decode('utf-8')
                print('Downloaded', js, 'length:', len(js_content))
                matches = [m for m in re.findall(r'https?://[^\s"\'<>]+', js_content) if any(x in m for x in ['render', 'api', '5000', 'buywise'])]
                print('Endpoints found in compiled bundle:', matches)
                # Check for how API_BASE was compiled
                demo_calls = [m for m in re.findall(r'.{0,50}/seed/demo.{0,50}', js_content)]
                print('Seed demo calls in JS:', demo_calls[:3])
except Exception as e:
    print('Error:', e)

