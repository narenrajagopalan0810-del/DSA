/**
 * Tower of Hanoi: Samurai Recursion Dojo - CLI Game in C
 * Play Tower of Hanoi directly in the terminal or test the C recursive engine!
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hanoi.h"

static void print_disk_layer(int disk, int max_disks) {
    int width = disk * 2 - 1;
    int max_width = max_disks * 2 + 1;
    int padding = (max_width - width) / 2;

    for (int i = 0; i < padding; i++) printf(" ");
    if (disk == 0) {
        printf("|");
    } else {
        printf("[");
        for (int i = 0; i < width - 2; i++) printf("=");
        printf("]");
    }
    for (int i = 0; i < padding; i++) printf(" ");
}

static void display_board(const HanoiState *state) {
    int max_d = state->num_disks;
    printf("\n");
    for (int row = max_d - 1; row >= 0; row--) {
        for (int p = 0; p < NUM_PEGS; p++) {
            int disk = (row < state->counts[p]) ? state->pegs[p][row] : 0;
            print_disk_layer(disk, max_d);
            printf("   ");
        }
        printf("\n");
    }

    int max_w = max_d * 2 + 1;
    for (int p = 0; p < NUM_PEGS; p++) {
        for (int i = 0; i < max_w; i++) printf("-");
        printf("   ");
    }
    printf("\n");

    const char *labels[] = {"  [A] ORIGIN", " [B] AUXILIARY", "  [C] TARGET"};
    for (int p = 0; p < NUM_PEGS; p++) {
        printf("%-*s   ", max_w, labels[p]);
    }
    printf("\n\n");
}

int main(int argc, char *argv[]) {
    int num_disks = 4;
    if (argc > 1) {
        num_disks = atoi(argv[1]);
        if (num_disks < 1) num_disks = 1;
        if (num_disks > MAX_DISKS) num_disks = MAX_DISKS;
    }

    HanoiState state;
    hanoi_init(&state, num_disks);
    long long min_m = hanoi_min_moves(num_disks);
    int move_count = 0;

    printf("=========================================================\n");
    printf("   ⛩️  TOWER OF HANOI: SAMURAI RECURSION DOJO (CLI) ⛩️   \n");
    printf("=========================================================\n");
    printf(" Disks: %d | Optimal minimum moves: %lld\n", num_disks, min_m);
    printf(" Commands:\n");
    printf("   <from> <to> : Move top disk (e.g. '0 2' or 'A C' or '1 3')\n");
    printf("   h           : Ask Master Kenji for optimal next-move hint\n");
    printf("   s           : Auto-solve demo using recursion\n");
    printf("   r           : Reset board\n");
    printf("   q           : Quit\n");
    printf("=========================================================\n");

    char line[128];
    while (1) {
        display_board(&state);
        printf("[Move #%d / Min: %lld] Enter command > ", move_count, min_m);

        if (!fgets(line, sizeof(line), stdin)) break;

        /* Strip trailing newline */
        line[strcspn(line, "\r\n")] = 0;
        if (strlen(line) == 0) continue;

        if (line[0] == 'q' || line[0] == 'Q') {
            printf("Honor to you, warrior! Until next time.\n");
            break;
        }

        if (line[0] == 'r' || line[0] == 'R') {
            hanoi_init(&state, num_disks);
            move_count = 0;
            printf("⛩️ Dojo reset! Begin anew.\n");
            continue;
        }

        if (line[0] == 'h' || line[0] == 'H') {
            int out_from, out_to, out_disk;
            char advice[256];
            if (hanoi_get_hint(&state, &out_from, &out_to, &out_disk, advice, sizeof(advice))) {
                printf("\n🥋 Master Kenji: %s (Move Disk %d from Peg %d to Peg %d)\n",
                       advice, out_disk, out_from, out_to);
            } else {
                printf("\n🥋 Master Kenji: %s\n", advice);
            }
            continue;
        }

        if (line[0] == 's' || line[0] == 'S') {
            printf("\n⚡ Generating recursive solution...\n");
            MoveList list;
            list.count = 0;
            hanoi_solve_recursive(num_disks, 0, 2, 1, &list);
            printf("Calculated %d optimal moves:\n", list.count);
            for (int i = 0; i < list.count; i++) {
                printf("  Step %2d: Move Disk %d from Peg %c to Peg %c\n",
                       list.moves[i].step, list.moves[i].disk,
                       'A' + list.moves[i].from_peg,
                       'A' + list.moves[i].to_peg);
            }
            printf("\n");
            continue;
        }

        /* Parse move command: e.g. "0 2" or "A C" or "1 3" */
        int from = -1, to = -1;
        char c1 = 0, c2 = 0;
        if (sscanf(line, " %c %c", &c1, &c2) == 2) {
            if (c1 >= '0' && c1 <= '2') from = c1 - '0';
            else if (c1 >= '1' && c1 <= '3') from = c1 - '1';
            else if (c1 >= 'a' && c1 <= 'c') from = c1 - 'a';
            else if (c1 >= 'A' && c1 <= 'C') from = c1 - 'A';

            if (c2 >= '0' && c2 <= '2') to = c2 - '0';
            else if (c2 >= '1' && c2 <= '3') to = c2 - '1';
            else if (c2 >= 'a' && c2 <= 'c') to = c2 - 'a';
            else if (c2 >= 'A' && c2 <= 'C') to = c2 - 'A';
        }

        if (from < 0 || to < 0) {
            printf("❌ Unrecognized input. Use format: '0 2' or 'A C', or 'h' for hint, 's' for solve.\n");
            continue;
        }

        char err[256];
        if (hanoi_apply_move(&state, from, to, err, sizeof(err))) {
            move_count++;
            printf("✅ Moved Disk %d to Peg %c!\n", state.pegs[to][state.counts[to] - 1], 'A' + to);
            if (hanoi_is_solved(&state)) {
                display_board(&state);
                printf("🎉 VICTORY OF THE SAMURAI! You completed %d disks in %d moves (Optimal: %lld)!\n",
                       num_disks, move_count, min_m);
                break;
            }
        } else {
            printf("❌ %s\n", err);
        }
    }

    return 0;
}
