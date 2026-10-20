/**
 * Tower of Hanoi: Samurai Recursion Dojo - Native C HTTP Backend Server
 * Cross-platform C REST API & static file server using WinSock2 / POSIX sockets.
 */

#ifdef _WIN32
  #ifndef WIN32_LEAN_AND_MEAN
  #define WIN32_LEAN_AND_MEAN
  #endif
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #pragma comment(lib, "ws2_32.lib")
  typedef int socklen_t;
  #define CLOSE_SOCKET(s) closesocket(s)
#else
  #include <sys/types.h>
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <arpa/inet.h>
  #include <unistd.h>
  #define SOCKET int
  #define INVALID_SOCKET (-1)
  #define SOCKET_ERROR (-1)
  #define CLOSE_SOCKET(s) close(s)
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "hanoi.h"

#define DEFAULT_PORT 8080
#define BUFFER_SIZE 65536

/* Helper to send HTTP response with CORS headers */
static void send_response(SOCKET client, int status_code, const char *status_text,
                          const char *content_type, const char *body, size_t body_len) {
    char header[1024];
    int header_len = snprintf(header, sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Connection: close\r\n"
        "\r\n",
        status_code, status_text, content_type, body_len);

    send(client, header, header_len, 0);
    if (body && body_len > 0) {
        send(client, body, (int)body_len, 0);
    }
}

static void send_json(SOCKET client, int status_code, const char *json_str) {
    send_response(client, status_code, (status_code == 200) ? "OK" : "Bad Request",
                  "application/json; charset=utf-8", json_str, strlen(json_str));
}

/* Very simple JSON int parser for basic key:value */
static int json_get_int(const char *json, const char *key, int default_val) {
    char search_pattern[64];
    snprintf(search_pattern, sizeof(search_pattern), "\"%s\"", key);
    char *pos = strstr(json, search_pattern);
    if (!pos) return default_val;

    pos += strlen(search_pattern);
    while (*pos == ' ' || *pos == ':' || *pos == '\t') pos++;
    return atoi(pos);
}

/* Parse pegs from JSON: e.g. "pegs":[[4,3,2,1],[],[]] or "towers":[[4,3,2,1],[],[]] */
static void parse_json_towers(const char *json, HanoiState *state) {
    if (!json || !state) return;
    for (int peg = 0; peg < NUM_PEGS; peg++) {
        state->counts[peg] = 0;
    }

    const char *key_pos = strstr(json, "\"towers\"");
    if (!key_pos) key_pos = strstr(json, "\"pegs\"");
    if (!key_pos) return;

    const char *p = strchr(key_pos, '[');
    if (!p) return;
    p++; /* Skip outer '[' */

    for (int peg = 0; peg < NUM_PEGS; peg++) {
        state->counts[peg] = 0;
        while (*p && *p != '[' && *p != ']') p++;
        if (*p == '[') {
            p++; /* Inside peg array */
            while (*p && *p != ']') {
                while (*p && (*p == ' ' || *p == ',' || *p == '\t')) p++;
                if (*p && isdigit((unsigned char)*p)) {
                    int val = atoi(p);
                    if (state->counts[peg] < MAX_DISKS) {
                        state->pegs[peg][state->counts[peg]++] = val;
                    }
                    while (*p && isdigit((unsigned char)*p)) p++;
                } else if (*p && *p != ']') {
                    p++;
                }
            }
            if (*p == ']') p++;
        }
    }
}

/* Helper to serve static files from parent or current directory */
static int serve_file(SOCKET client, const char *relative_path) {
    char file_path[512];
    /* Try parent directory first (if running inside c_backend/), then current dir */
    snprintf(file_path, sizeof(file_path), "../%s", relative_path);
    FILE *f = fopen(file_path, "rb");
    if (!f) {
        snprintf(file_path, sizeof(file_path), "./%s", relative_path);
        f = fopen(file_path, "rb");
    }

    if (!f) return 0; /* File not found */

    fseek(f, 0, SEEK_END);
    long file_size = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *file_data = (char*)malloc(file_size);
    if (!file_data) {
        fclose(f);
        return 0;
    }

    fread(file_data, 1, file_size, f);
    fclose(f);

    const char *content_type = "text/plain";
    if (strstr(relative_path, ".html")) content_type = "text/html; charset=utf-8";
    else if (strstr(relative_path, ".css")) content_type = "text/css; charset=utf-8";
    else if (strstr(relative_path, ".js")) content_type = "application/javascript; charset=utf-8";
    else if (strstr(relative_path, ".jpg") || strstr(relative_path, ".jpeg")) content_type = "image/jpeg";
    else if (strstr(relative_path, ".png")) content_type = "image/png";
    else if (strstr(relative_path, ".ico")) content_type = "image/x-icon";
    else if (strstr(relative_path, ".json")) content_type = "application/json";

    send_response(client, 200, "OK", content_type, file_data, (size_t)file_size);
    free(file_data);
    return 1;
}

/* Handle individual HTTP client connection */
static void handle_client(SOCKET client) {
    char request_buf[BUFFER_SIZE];
    int bytes_received = recv(client, request_buf, sizeof(request_buf) - 1, 0);
    if (bytes_received <= 0) {
        CLOSE_SOCKET(client);
        return;
    }
    request_buf[bytes_received] = '\0';

    char method[16], url[256];
    if (sscanf(request_buf, "%15s %255s", method, url) != 2) {
        send_json(client, 400, "{\"error\":\"Malformed HTTP request\"}");
        CLOSE_SOCKET(client);
        return;
    }

    /* CORS preflight OPTIONS check */
    if (strcmp(method, "OPTIONS") == 0) {
        send_response(client, 204, "No Content", "text/plain", NULL, 0);
        CLOSE_SOCKET(client);
        return;
    }

    /* Locate HTTP body (after \r\n\r\n) */
    char *body = strstr(request_buf, "\r\n\r\n");
    if (body) {
        body += 4;
        int header_len = (int)(body - request_buf);
        int current_body_len = bytes_received - header_len;
        int content_len = 0;
        char *cl_pos = strstr(request_buf, "Content-Length:");
        if (!cl_pos) cl_pos = strstr(request_buf, "content-length:");
        if (cl_pos) content_len = atoi(cl_pos + 15);

        while (current_body_len < content_len && bytes_received < BUFFER_SIZE - 1) {
            int needed = content_len - current_body_len;
            int r = recv(client, request_buf + bytes_received, needed, 0);
            if (r <= 0) break;
            bytes_received += r;
            current_body_len += r;
            request_buf[bytes_received] = '\0';
        }
    } else {
        body = "";
    }

    /* Route: GET /api/health */
    if (strncmp(url, "/api/health", 11) == 0 || strncmp(url, "/api/status", 11) == 0) {
        const char *resp = "{\"status\":\"online\",\"engine\":\"Native C WinSock2 Backend (Compiled Binary)\",\"version\":\"2.0.0\",\"author\":\"Master Kenji\"}";
        send_json(client, 200, resp);
    }
    /* Route: GET /api/solve?disks=N */
    else if (strncmp(url, "/api/solve", 10) == 0) {
        int disks = 4;
        char *q = strstr(url, "disks=");
        if (q) disks = atoi(q + 6);
        if (disks < 1) disks = 1;
        if (disks > 10) disks = 10;

        MoveList list;
        list.count = 0;
        hanoi_solve_recursive(disks, 0, 2, 1, &list);

        char *json = hanoi_movelist_to_json(&list);
        if (json) {
            send_json(client, 200, json);
            free(json);
        } else {
            send_json(client, 500, "{\"error\":\"Memory allocation failed\"}");
        }
    }
    /* Route: POST /api/move */
    else if (strcmp(method, "POST") == 0 && strncmp(url, "/api/move", 9) == 0) {
        int from = json_get_int(body, "from", -1);
        int to = json_get_int(body, "to", -1);
        int disks = json_get_int(body, "disks", 4);

        HanoiState state;
        memset(&state, 0, sizeof(state));
        state.num_disks = disks;
        parse_json_towers(body, &state);

        char error_msg[256] = "";
        int valid = hanoi_apply_move(&state, from, to, error_msg, sizeof(error_msg));

        if (!valid) {
            char resp[512];
            snprintf(resp, sizeof(resp),
                     "{\"success\":false,\"valid\":false,\"error\":\"%s\"}", error_msg);
            send_json(client, 200, resp);
        } else {
            int moved_disk = (to >= 0 && to < NUM_PEGS && state.counts[to] > 0) ? state.pegs[to][state.counts[to] - 1] : 0;
            char *state_json = hanoi_state_to_json(&state, moved_disk);
            send_json(client, 200, state_json ? state_json : "{\"success\":true,\"valid\":true}");
            if (state_json) free(state_json);
        }
    }
    /* Route: POST /api/hint */
    else if (strcmp(method, "POST") == 0 && strncmp(url, "/api/hint", 9) == 0) {
        int disks = json_get_int(body, "disks", 4);
        HanoiState state;
        memset(&state, 0, sizeof(state));
        state.num_disks = disks;
        parse_json_towers(body, &state);

        int out_from = 0, out_to = 0, out_disk = 0;
        char advice[256] = "";
        int has_hint = hanoi_get_hint(&state, &out_from, &out_to, &out_disk, advice, sizeof(advice));

        char resp[512];
        snprintf(resp, sizeof(resp),
                 "{\"success\":true,\"has_hint\":%s,\"from\":%d,\"to\":%d,\"disk\":%d,\"advice\":\"%s\"}",
                 has_hint ? "true" : "false", out_from, out_to, out_disk, advice);
        send_json(client, 200, resp);
    }
    /* Route: GET /api/metrics?disks=N */
    else if (strncmp(url, "/api/metrics", 12) == 0) {
        int disks = 4;
        char *q = strstr(url, "disks=");
        if (q) disks = atoi(q + 6);
        long long min_m = hanoi_min_moves(disks);

        char resp[512];
        snprintf(resp, sizeof(resp),
                 "{\"success\":true,\"disks\":%d,\"min_moves\":%lld,\"formula\":\"2^n - 1\","
                 "\"time_complexity\":\"O(2^N)\",\"space_complexity\":\"O(N) (call stack)\"}",
                 disks, min_m);
        send_json(client, 200, resp);
    }
    /* Static file server routes */
    else {
        char file_name[256];
        const char *raw_path = url + 1; /* strip leading slash */
        if (strlen(raw_path) == 0) {
            strncpy(file_name, "index.html", sizeof(file_name) - 1);
        } else {
            strncpy(file_name, raw_path, sizeof(file_name) - 1);
        }
        file_name[sizeof(file_name) - 1] = '\0';

        char *qmark = strchr(file_name, '?');
        if (qmark) *qmark = '\0';

        if (!serve_file(client, file_name)) {
            send_response(client, 404, "Not Found", "text/plain", "404 Not Found", 13);
        }
    }

    CLOSE_SOCKET(client);
}

int main(int argc, char *argv[]) {
    int port = DEFAULT_PORT;
    if (argc > 1) {
        port = atoi(argv[1]);
        if (port <= 0) port = DEFAULT_PORT;
    }

#ifdef _WIN32
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        fprintf(stderr, "Failed to initialize WinSock. Error Code: %d\n", WSAGetLastError());
        return 1;
    }
#endif

    SOCKET server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == INVALID_SOCKET) {
        fprintf(stderr, "Failed to create socket.\n");
        return 1;
    }

    int opt = 1;
#ifdef _WIN32
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
#else
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons((unsigned short)port);

    if (bind(server_fd, (struct sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        fprintf(stderr, "Bind failed on port %d. Port may already be in use.\n", port);
        CLOSE_SOCKET(server_fd);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    if (listen(server_fd, 10) == SOCKET_ERROR) {
        fprintf(stderr, "Listen failed.\n");
        CLOSE_SOCKET(server_fd);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    printf("====================================================\n");
    printf(" ⛩️  SAMURAI HANOI RECURSION DOJO - C BACKEND SERVER \n");
    printf("====================================================\n");
    printf(" Native C WinSock2 Engine Active on port %d\n", port);
    printf(" URL: http://localhost:%d\n", port);
    printf(" Endpoints:\n");
    printf("   GET  /api/health       -> Server & Engine Status\n");
    printf("   GET  /api/solve?disks=N-> Recursive Hanoi Solver\n");
    printf("   POST /api/move         -> Legal Move Rule Validator\n");
    printf("   POST /api/hint         -> Optimal Next Move Engine\n");
    printf("   GET  /api/metrics      -> Complexity Analysis\n");
    printf("====================================================\n");

    while (1) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        SOCKET client = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
        if (client != INVALID_SOCKET) {
            handle_client(client);
        }
    }

    CLOSE_SOCKET(server_fd);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
