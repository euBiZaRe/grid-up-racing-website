import http.server
import socketserver
import sys

class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers['Content-Length'])
        print("RESULT:")
        print(self.rfile.read(length).decode('utf-8'))
        self.send_response(200)
        self.end_headers()
        import threading
        threading.Thread(target=self.server.shutdown).start()

if __name__ == "__main__":
    server = socketserver.TCPServer(("", 9999), Handler)
    print("Listening on 9999")
    server.serve_forever()
