/**
 * Tower of Hanoi: Samurai Recursion Engine - C Backend Header
 * Pure C implementation of Tower of Hanoi recursive logic,
 * state validation, optimal solver, and next-move hint generator.
 */

#ifndef HANOI_H
#define HANOI_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define MAX_DISKS 12
#define NUM_PEGS 3
#define MAX_MOVES 4096

/* Represents the Tower of Hanoi game state */
typedef struct {
    int pegs[NUM_PEGS][MAX_DISKS]; /* Stack of disks on each peg: pegs[i][0] is bottom, pegs[i][counts[i]-1] is top */
    int counts[NUM_PEGS];          /* Number of disks currently on each peg */
    int num_disks;                 /* Total disks in the game (1 to MAX_DISKS) */
} HanoiState;

/* Represents a single move operation */
typedef struct {
    int disk;      /* Disk number (1 = smallest, N = largest) */
    int from_peg;  /* 0 = A, 1 = B, 2 = C */
    int to_peg;    /* 0 = A, 1 = B, 2 = C */
    int step;      /* Step index (1-based) */
} HanoiMove;

/* List of generated moves from recursion solver */
typedef struct {
    HanoiMove moves[MAX_MOVES];
    int count;
} MoveList;

/* Function Prototypes */

/**
 * Initializes a Hanoi game state with num_disks stacked on peg 0 (Tower A).
 */
void hanoi_init(HanoiState *state, int num_disks);

/**
 * Validates whether a move from from_peg to to_peg is legal.
 * Returns 1 if valid, 0 if invalid (with reason stored in error_buf).
 */
int hanoi_validate_move(const HanoiState *state, int from_peg, int to_peg, char *error_buf, int error_buf_size);

/**
 * Applies a move from from_peg to to_peg if valid.
 * Returns 1 on success, 0 on failure.
 */
int hanoi_apply_move(HanoiState *state, int from_peg, int to_peg, char *error_buf, int error_buf_size);

/**
 * Checks if the puzzle is completed (all disks on peg 2 / Tower C).
 * Returns 1 if solved, 0 otherwise.
 */
int hanoi_is_solved(const HanoiState *state);

/**
 * Calculates the theoretical minimum moves: 2^n - 1.
 */
long long hanoi_min_moves(int num_disks);

/**
 * Recursively generates the optimal move sequence from from_peg to to_peg.
 * Complexity: O(2^N) steps.
 */
void hanoi_solve_recursive(int n, int from_peg, int to_peg, int aux_peg, MoveList *list);

/**
 * Calculates the optimal next move from ANY arbitrary board state.
 * Returns 1 if a move was found, 0 if already solved or invalid.
 */
int hanoi_get_hint(const HanoiState *state, int *out_from, int *out_to, int *out_disk, char *advice_buf, int advice_buf_size);

/**
 * Serializes the current HanoiState into a JSON string.
 * Caller must free() the returned pointer.
 */
char* hanoi_state_to_json(const HanoiState *state, int moved_disk);

/**
 * Serializes a MoveList into a JSON string array of steps.
 * Caller must free() the returned pointer.
 */
char* hanoi_movelist_to_json(const MoveList *list);

#endif /* HANOI_H */
