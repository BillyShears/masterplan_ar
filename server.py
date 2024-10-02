import http.server
import ssl

# Use '0.0.0.0' to listen on all interfaces
server_address = "0.0.0.0"
port = 8000
ip = "192.168.1.148"

server_address = (server_address, port)
handler_class = http.server.SimpleHTTPRequestHandler

httpd = http.server.HTTPServer(server_address, handler_class)

# Load the new certificate and key
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile=f"{ip}.pem", keyfile=f"{ip}-key.pem")

httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"Serving on https://{server_address}:{port}")
httpd.serve_forever()
