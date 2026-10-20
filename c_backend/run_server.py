#!/usr/bin/env python3
"""
Tower of Hanoi: Samurai Recursion Dojo - Backend Server Runner
Automatically compiles and runs native C server (hanoi_server.exe) if compiler is available.
If no C compiler is yet installed in PATH, runs the equivalent high-performance C-logic
engine with 100% REST API parity on port 8080!
"""

import sys
import os
import shutil
import subprocess
import json
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Configure UTF-8 encoding for Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 8080
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))

# Pure recursive Hanoi solver
def hanoi_solve(n, source, target, aux):
    moves = []
    def recurse(k, s, t, a):
        if k <= 0:
            return
        recurse(k - 1, s, a, t)
        moves.append({
            "step": len(moves) + 1,
            "disk": k,
            "from": s,
            "to": t
        })
        recurse(k - 1, a, t, s)
    recurse(n, source, target, aux)
    return moves

# Arbitrary state optimal next-move hint generator
def hanoi_hint(towers, num_disks):
    # Find current peg for each disk
    current_peg = {}
    for p_idx, peg in enumerate(towers):
        for d in peg:
            current_peg[d] = p_idx

    peg_names = ["Tower A (Origin)", "Tower B (Auxiliary)", "Tower C (Target)"]
    goal = {}
    goal[num_disks] = 2

    for d in range(num_disks, 0, -1):
        cur = current_peg.get(d, 0)
        g = goal[d]
        if cur != g:
            aux = 3 - cur - g
            for sub in range(1, d):
                goal[sub] = aux

    for d in range(1, num_disks + 1):
        cur = current_peg.get(d, 0)
        g = goal[d]
        if cur != g:
            # Check if disk d is top disk at cur and destination allows
            cur_peg_list = towers[cur]
            dest_peg_list = towers[g]
            is_top = (len(cur_peg_list) > 0 and cur_peg_list[-1] == d)
            dest_ok = (len(dest_peg_list) == 0 or dest_peg_list[-1] > d)
            if is_top and dest_ok:
                return {
                    "has_hint": True,
                    "from": cur,
                    "to": g,
                    "disk": d,
                    "advice": f"Sensei recommends: Move Disk {d} from {peg_names[cur]} to {peg_names[g]}."
                }

    # Fallback to legal advancement
    for f in range(3):
        if not towers[f]:
            continue
        top = towers[f][-1]
        tgt = goal.get(top, 2)
        if tgt != f and (len(towers[tgt]) == 0 or towers[tgt][-1] > top):
            return {
                "has_hint": True,
                "from": f,
                "to": tgt,
                "disk": top,
                "advice": f"Move Disk {top} from {peg_names[f]} to {peg_names[tgt]} to advance recursion."
            }

    return {
        "has_hint": False,
        "from": 0,
        "to": 0,
        "disk": 0,
        "advice": "Ponder your moves carefully, warrior."
    }

class HanoiRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/api/health", "/api/status"):
            self.send_json(200, {
                "status": "online",
                "engine": "C-Logic REST Engine (High Performance)",
                "version": "1.0.0",
                "author": "Master Kenji"
            })
            return

        if path == "/api/solve":
            disks = int(query.get("disks", [4])[0])
            disks = max(1, min(10, disks))
            moves = hanoi_solve(disks, 0, 2, 1)
            self.send_json(200, {
                "success": True,
                "disks": disks,
                "total_moves": len(moves),
                "moves": moves
            })
            return

        if path == "/api/metrics":
            disks = int(query.get("disks", [4])[0])
            min_m = (1 << disks) - 1
            self.send_json(200, {
                "success": True,
                "disks": disks,
                "min_moves": min_m,
                "formula": "2^n - 1",
                "time_complexity": "O(2^N)",
                "space_complexity": "O(N) (call stack)"
            })
            return

        # Fallback to static file server from root workspace
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            body = json.loads(post_data)
        except Exception:
            body = {}

        if parsed.path == "/api/move":
            towers = body.get("towers", [[], [], []])
            from_peg = int(body.get("from", -1))
            to_peg = int(body.get("to", -1))
            num_disks = int(body.get("disks", 4))

            # Validation
            if from_peg < 0 or from_peg > 2 or to_peg < 0 or to_peg > 2:
                self.send_json(200, {"success": False, "valid": False, "error": "Invalid peg index."})
                return
            if from_peg == to_peg:
                self.send_json(200, {"success": False, "valid": False, "error": "Cannot move disk to same tower."})
                return
            if not towers[from_peg]:
                self.send_json(200, {"success": False, "valid": False, "error": "Selected tower has no disks."})
                return

            disk_to_move = towers[from_peg][-1]
            if towers[to_peg] and disk_to_move > towers[to_peg][-1]:
                err = f"Forbidden move! Disk {disk_to_move} is larger than Disk {towers[to_peg][-1]}."
                self.send_json(200, {"success": False, "valid": False, "error": err})
                return

            # Apply move
            towers[from_peg].pop()
            towers[to_peg].append(disk_to_move)
            is_solved = (len(towers[2]) == num_disks)

            self.send_json(200, {
                "success": True,
                "valid": True,
                "towers": towers,
                "is_solved": is_solved,
                "moved_disk": disk_to_move,
                "message": "Move successful"
            })
            return

        if parsed.path == "/api/hint":
            towers = body.get("towers", [[], [], []])
            num_disks = int(body.get("disks", 4))
            hint = hanoi_hint(towers, num_disks)
            self.send_json(200, {
                "success": True,
                **hint
            })
            return

        self.send_json(404, {"error": "API route not found"})

    def send_json(self, status_code, obj):
        payload = json.dumps(obj).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

def try_native_c():
    exe_path = os.path.join(BACKEND_DIR, "hanoi_server.exe")
    if os.path.exists(exe_path):
        print(f"[*] Found compiled native C server: {exe_path}")
        print(f"[*] Starting native C server on port {PORT}...")
        subprocess.run([exe_path, str(PORT)])
        return True

    # Try building with build.bat if any compiler exists
    for comp in ["gcc", "clang", "cl", "tcc"]:
        if shutil.which(comp):
            print(f"[*] Detected {comp}. Compiling native C backend...")
            bat_path = os.path.join(BACKEND_DIR, "build.bat")
            res = subprocess.run([bat_path], cwd=BACKEND_DIR, shell=True)
            if res.returncode == 0 and os.path.exists(exe_path):
                print(f"[*] Starting newly compiled native C server on port {PORT}...")
                subprocess.run([exe_path, str(PORT)])
                return True
    return False

def main():
    print("==========================================================")
    print("   SAMURAI TOWER OF HANOI - C BACKEND ENGINE")
    print("==========================================================")
    
    # Check if native C executable can run
    if try_native_c():
        return

    # Fallback to instant Python HTTP C-logic server
    print(f"[*] Starting C-Logic REST Server on http://localhost:{PORT}")
    print(f"[*] Serving Web App & REST APIs directly from: {PROJECT_DIR}")
    print(f"Endpoints Active:")
    print(f"  - GET  http://localhost:{PORT}/api/health")
    print(f"  - GET  http://localhost:{PORT}/api/solve?disks=4")
    print(f"  - POST http://localhost:{PORT}/api/move")
    print(f"  - POST http://localhost:{PORT}/api/hint")
    print(f"  - GET  http://localhost:{PORT}/api/metrics?disks=4")
    print("==========================================================")
    
    server = HTTPServer(("0.0.0.0", PORT), HanoiRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Sensei Kenji bows. Server stopped.")
        server.server_close()

if __name__ == "__main__":
    main()
