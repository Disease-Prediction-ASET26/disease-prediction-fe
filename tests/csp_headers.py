#!/usr/bin/env python3
"""Check CSP headers of locally built dev and prod frontend images."""
import re
import subprocess
import time
import urllib.request


def check(image, header_name, origin, override=None):
    command = ['docker', 'run', '--detach', '--rm', '-p', '127.0.0.1::8080',
               '-e', 'API_UPSTREAM=http://127.0.0.1:18088']
    if override:
        command += ['-e', f'CSP_HEADER_NAME={override}']
    container = subprocess.check_output(command + [image], text=True).strip()
    try:
        address = subprocess.check_output(['docker', 'port', container, '8080/tcp'], text=True).strip()
        url = f'http://{address}/login'
        for attempt in range(50):
            try:
                with urllib.request.urlopen(url, timeout=2) as response:
                    first = response.headers
                break
            except OSError:
                if attempt == 49:
                    raise
                time.sleep(0.1)
        with urllib.request.urlopen(url, timeout=2) as response:
            second = response.headers
        first_policy = first[header_name]
        second_policy = second[header_name]
        assert first_policy and second_policy, 'CSP header missing'
        other = 'Content-Security-Policy-Report-Only' if header_name == 'Content-Security-Policy' else 'Content-Security-Policy'
        assert first[other] is None, 'unexpected CSP mode'
        assert origin in first_policy, 'wrong Hanko origin'
        assert 'no-store' in first.get('Cache-Control', '').lower(), 'HTML must not be cached'
        assert "script-src 'self' 'nonce-" in first_policy, 'missing script nonce'
        script_policy = first_policy.split('script-src ', 1)[1].split(';', 1)[0]
        assert "'unsafe-inline'" not in script_policy, 'unsafe inline scripts enabled'
        a = re.search(r"'nonce-([0-9a-f]{32})'", first_policy)
        b = re.search(r"'nonce-([0-9a-f]{32})'", second_policy)
        assert a and b and a.group(1) != b.group(1), 'nonce missing or reused'
        print(f'{image}: {header_name}, correct origin, no-store and unique nonces verified')
    finally:
        subprocess.run(['docker', 'rm', '-f', container], stdout=subprocess.DEVNULL, check=False)


check('pocket-csp-frontend:dev', 'Content-Security-Policy', 'https://identity-dev.pocket-doc.app')
check('pocket-csp-frontend:prod', 'Content-Security-Policy-Report-Only', 'https://identity.pocket-doc.app')
check('pocket-csp-frontend:dev', 'Content-Security-Policy-Report-Only', 'https://identity-dev.pocket-doc.app', 'Content-Security-Policy-Report-Only')
