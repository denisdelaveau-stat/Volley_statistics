"""Serve this folder on the local Wi-Fi for a quick iPhone test (online only).
Offline mode needs HTTPS (see README.md)."""
import http.server, socket, socketserver, os
PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 80)); ip = s.getsockname()[0]
except OSError:
    ip = "127.0.0.1"
finally:
    s.close()
print(f"Open on the iPhone (same Wi-Fi):  http://{ip}:{PORT}/   - Ctrl+C to stop")
with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()
