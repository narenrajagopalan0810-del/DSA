/**
 * Tower of Hanoi: Samurai Recursion Engine - C Backend Implementation
 */

#include "hanoi.h"

void hanoi_init(HanoiState *state, int num_disks) {
    if (!state) return;
    if (num_disks < 1) num_disks = 1;
    if (num_disks > MAX_DISKS) num_disks = MAX_DISKS;

    state->num_disks = num_disks;
    for (int i = 0; i < NUM_PEGS; i++) {
        state->counts[i] = 0;
        for (int j = 0; j < MAX_DISKS; j++) {
            state->pegs[i][j] = 0;
        }
    }

    /* Stack disks on Peg 0 (Tower A): bottom is disk num_disks, top is disk 1 */
    for (int d = num_disks; d >= 1; d--) {
        state->pegs[0][state->counts[0]++] = d;
    }
}

int hanoi_validate_move(const HanoiState *state, int from_peg, int to_peg, char *error_buf, int error_buf_size) {
    if (!state) {
        if (error_buf) snprintf(error_buf, error_buf_size, "Internal error: State is NULL.");
        return 0;
    }

    if (from_peg < 0 || from_peg >= NUM_PEGS || to_peg < 0 || to_peg >= NUM_PEGS) {
        if (error_buf) snprintf(error_buf, error_buf_size, "Invalid peg index. Pegs must be 0, 1, or 2.");
        return 0;
    }

    if (from_peg == to_peg) {
        if (error_buf) snprintf(error_buf, error_buf_size, "Source and destination towers are identical.");
        return 0;
    }

    if (state->counts[from_peg] == 0) {
        if (error_buf) snprintf(error_buf, error_buf_size, "Selected tower has no disks to move.");
        return 0;
    }

    int disk_to_move = state->pegs[from_peg][state->counts[from_peg] - 1];

    if (state->counts[to_peg] > 0) {
        int target_top_disk = state->pegs[to_peg][state->counts[to_peg] - 1];
        if (disk_to_move > target_top_disk) {
            if (error_buf) {
                snprintf(error_buf, error_buf_size,
                         "Forbidden move! Disk %d is larger than Disk %d on destination tower.",
                         disk_to_move, target_top_disk);
            }
            return 0;
        }
    }

    if (error_buf && error_buf_size > 0) {
        error_buf[0] = '\0';
    }
    return 1;
}

int hanoi_apply_move(HanoiState *state, int from_peg, int to_peg, char *error_buf, int error_buf_size) {
    if (!hanoi_validate_move(state, from_peg, to_peg, error_buf, error_buf_size)) {
        return 0;
    }

    int disk = state->pegs[from_peg][--state->counts[from_peg]];
    state->pegs[to_peg][state->counts[to_peg]++] = disk;
    return 1;
}

int hanoi_is_solved(const HanoiState *state) {
    if (!state) return 0;
    return (state->counts[2] == state->num_disks && state->counts[0] == 0 && state->counts[1] == 0);
}

long long hanoi_min_moves(int num_disks) {
    if (num_disks <= 0) return 0;
    if (num_disks >= 62) return -1; /* Avoid overflow */
    return (1LL << num_disks) - 1;
}

void hanoi_solve_recursive(int n, int from_peg, int to_peg, int aux_peg, MoveList *list) {
    if (n <= 0 || !list) return;
    if (list->count >= MAX_MOVES - 1) return;

    /* Step 1: Recursively move n-1 disks from source to auxiliary */
    hanoi_solve_recursive(n - 1, from_peg, aux_peg, to_peg, list);

    /* Step 2: Move the nth disk directly from source to target */
    if (list->count < MAX_MOVES) {
        list->moves[list->count].disk = n;
        list->moves[list->count].from_peg = from_peg;
        list->moves[list->count].to_peg = to_peg;
        list->moves[list->count].step = list->count + 1;
        list->count++;
    }

    /* Step 3: Recursively move n-1 disks from auxiliary to target */
    hanoi_solve_recursive(n - 1, aux_peg, to_peg, from_peg, list);
}

static const char* peg_name(int peg) {
    switch (peg) {
        case 0: return "Tower A (Origin)";
        case 1: return "Tower B (Auxiliary)";
        case 2: return "Tower C (Target)";
        default: return "Unknown";
    }
}

int hanoi_get_hint(const HanoiState *state, int *out_from, int *out_to, int *out_disk, char *advice_buf, int advice_buf_size) {
    if (!state || hanoi_is_solved(state)) {
        if (advice_buf) snprintf(advice_buf, advice_buf_size, "The puzzle is already solved!");
        return 0;
    }

    int n = state->num_disks;
    int goal[MAX_DISKS + 1];
    int current_peg[MAX_DISKS + 1];

    /* Find current location of each disk */
    for (int p = 0; p < NUM_PEGS; p++) {
        for (int i = 0; i < state->counts[p]; i++) {
            int d = state->pegs[p][i];
            if (d >= 1 && d <= n) {
                current_peg[d] = p;
            }
        }
    }

    /* Target peg for the largest disk is Peg 2 (Tower C) */
    goal[n] = 2;

    /* Compute goals from largest disk down to smallest */
    for (int d = n; d >= 1; d--) {
        int cur = current_peg[d];
        int g = goal[d];
        if (cur != g) {
            int aux = 3 - cur - g;
            for (int sub = 1; sub < d; sub++) {
                goal[sub] = aux;
            }
        }
    }

    /* Find the smallest disk d whose current peg != goal */
    for (int d = 1; d <= n; d++) {
        int cur = current_peg[d];
        int g = goal[d];
        if (cur != g) {
            /* Check if disk d can move directly from cur to g */
            int is_top_at_cur = (state->counts[cur] > 0 && state->pegs[cur][state->counts[cur] - 1] == d);
            int dest_allows = (state->counts[g] == 0 || state->pegs[g][state->counts[g] - 1] > d);

            if (is_top_at_cur && dest_allows) {
                if (out_from) *out_from = cur;
                if (out_to) *out_to = g;
                if (out_disk) *out_disk = d;
                if (advice_buf) {
                    snprintf(advice_buf, advice_buf_size,
                             "Sensei recommends: Move Disk %d from %s to %s.",
                             d, peg_name(cur), peg_name(g));
                }
                return 1;
            }
        }
    }

    /* Fallback: any legal move towards advancing a top disk */
    for (int from = 0; from < NUM_PEGS; from++) {
        if (state->counts[from] == 0) continue;
        int top_disk = state->pegs[from][state->counts[from] - 1];
        int target = goal[top_disk];
        if (target != from && hanoi_validate_move(state, from, target, NULL, 0)) {
            if (out_from) *out_from = from;
            if (out_to) *out_to = target;
            if (out_disk) *out_disk = top_disk;
            if (advice_buf) {
                snprintf(advice_buf, advice_buf_size,
                         "Move Disk %d from %s to %s to advance recursion.",
                         top_disk, peg_name(from), peg_name(target));
            }
            return 1;
        }
    }

    if (advice_buf) snprintf(advice_buf, advice_buf_size, "Ponder your moves carefully, warrior.");
    return 0;
}

char* hanoi_state_to_json(const HanoiState *state, int moved_disk) {
    if (!state) return NULL;
    char *buf = (char*)malloc(2048);
    if (!buf) return NULL;

    int offset = snprintf(buf, 2048, "{\"success\":true,\"valid\":true,\"num_disks\":%d,\"is_solved\":%s,\"moved_disk\":%d,\"towers\":[",
                          state->num_disks, hanoi_is_solved(state) ? "true" : "false", moved_disk);

    for (int p = 0; p < NUM_PEGS; p++) {
        offset += snprintf(buf + offset, 2048 - offset, "[");
        for (int i = 0; i < state->counts[p]; i++) {
            offset += snprintf(buf + offset, 2048 - offset, "%d%s",
                               state->pegs[p][i], (i + 1 < state->counts[p]) ? "," : "");
        }
        offset += snprintf(buf + offset, 2048 - offset, "]%s", (p + 1 < NUM_PEGS) ? "," : "");
    }

    offset += snprintf(buf + offset, 2048 - offset, "],\"pegs\":[");
    for (int p = 0; p < NUM_PEGS; p++) {
        offset += snprintf(buf + offset, 2048 - offset, "[");
        for (int i = 0; i < state->counts[p]; i++) {
            offset += snprintf(buf + offset, 2048 - offset, "%d%s",
                               state->pegs[p][i], (i + 1 < state->counts[p]) ? "," : "");
        }
        offset += snprintf(buf + offset, 2048 - offset, "]%s", (p + 1 < NUM_PEGS) ? "," : "");
    }

    offset += snprintf(buf + offset, 2048 - offset, "],\"counts\":[%d,%d,%d]}",
                       state->counts[0], state->counts[1], state->counts[2]);

    return buf;
}

char* hanoi_movelist_to_json(const MoveList *list) {
    if (!list) return NULL;
    /* Estimate buffer size: ~64 bytes per move */
    size_t buf_size = 512 + (size_t)list->count * 70;
    char *buf = (char*)malloc(buf_size);
    if (!buf) return NULL;

    int offset = snprintf(buf, buf_size, "{\"success\":true,\"total_moves\":%d,\"moves\":[", list->count);

    for (int i = 0; i < list->count; i++) {
        offset += snprintf(buf + offset, buf_size - offset,
                           "{\"step\":%d,\"disk\":%d,\"from\":%d,\"to\":%d}%s",
                           list->moves[i].step,
                           list->moves[i].disk,
                           list->moves[i].from_peg,
                           list->moves[i].to_peg,
                           (i + 1 < list->count) ? "," : "");
    }

    snprintf(buf + offset, buf_size - offset, "]}");
    return buf;
}
