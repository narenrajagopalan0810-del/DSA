#!/usr/bin/env python3
"""
Tower of Hanoi: Samurai Recursion Dojo - CLI Game
Zero-setup interactive terminal game matching hanoi_cli.c logic!
"""

import sys
import os

# Configure UTF-8 encoding for Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def print_disk_layer(disk, max_disks):
    width = disk * 2 - 1
    max_width = max_disks * 2 + 1
    padding = (max_width - width) // 2

    sys.stdout.write(" " * padding)
    if disk == 0:
        sys.stdout.write("|")
    else:
        sys.stdout.write("[" + "=" * (width - 2) + "]")
    sys.stdout.write(" " * padding)

def display_board(pegs, max_disks):
    print()
    for row in range(max_disks - 1, -1, -1):
        for p in range(3):
            disk = pegs[p][row] if row < len(pegs[p]) else 0
            print_disk_layer(disk, max_disks)
            sys.stdout.write("   ")
        print()

    max_w = max_disks * 2 + 1
    for p in range(3):
        sys.stdout.write("-" * max_w + "   ")
    print()

    labels = ["  [A] ORIGIN", " [B] AUXILIARY", "  [C] TARGET"]
    for p in range(3):
        sys.stdout.write(f"{labels[p]:<{max_w}}   ")
    print("\n")

def hanoi_solve(n, source, target, aux, moves):
    if n <= 0:
        return
    hanoi_solve(n - 1, source, aux, target, moves)
    moves.append((n, source, target))
    hanoi_solve(n - 1, aux, target, source, moves)

def get_hint(pegs, num_disks):
    current_peg = {}
    for p_idx, peg in enumerate(pegs):
        for d in peg:
            current_peg[d] = p_idx

    peg_names = ["Tower A (Origin)", "Tower B (Auxiliary)", "Tower C (Target)"]
    goal = {num_disks: 2}

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
            is_top = (len(pegs[cur]) > 0 and pegs[cur][-1] == d)
            dest_ok = (len(pegs[g]) == 0 or pegs[g][-1] > d)
            if is_top and dest_ok:
                return cur, g, d, f"Sensei recommends: Move Disk {d} from {peg_names[cur]} to {peg_names[g]}."

    for f in range(3):
        if not pegs[f]:
            continue
        top = pegs[f][-1]
        tgt = goal.get(top, 2)
        if tgt != f and (len(pegs[tgt]) == 0 or pegs[tgt][-1] > top):
            return f, tgt, top, f"Move Disk {top} from {peg_names[f]} to {peg_names[tgt]} to advance recursion."

    return None, None, None, "Ponder your moves carefully, warrior."

def main():
    num_disks = 4
    if len(sys.argv) > 1:
        try:
            num_disks = int(sys.argv[1])
            num_disks = max(1, min(10, num_disks))
        except ValueError:
            num_disks = 4

    pegs = [list(range(num_disks, 0, -1)), [], []]
    min_moves = (1 << num_disks) - 1
    move_count = 0

    print("=========================================================")
    print("   SAMURAI TOWER OF HANOI: RECURSION DOJO (CLI)")
    print("=========================================================")
    print(f" Disks: {num_disks} | Optimal minimum moves: {min_moves}")
    print(" Commands:")
    print("   <from> <to> : Move top disk (e.g. '0 2' or 'A C' or '1 3')")
    print("   h           : Ask Master Kenji for optimal next-move hint")
    print("   s           : Auto-solve demo using recursion")
    print("   r           : Reset board")
    print("   q           : Quit")
    print("=========================================================")

    while True:
        display_board(pegs, num_disks)
        try:
            line = input(f"[Move #{move_count} / Min: {min_moves}] Enter command > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nHonor to you, warrior! Until next time.")
            break

        if not line:
            continue

        cmd = line.lower()
        if cmd == 'q':
            print("Honor to you, warrior! Until next time.")
            break

        if cmd == 'r':
            pegs = [list(range(num_disks, 0, -1)), [], []]
            move_count = 0
            print("Dojo reset! Begin anew.")
            continue

        if cmd == 'h':
            f, t, d, advice = get_hint(pegs, num_disks)
            print(f"\n🥋 Master Kenji: {advice}\n")
            continue

        if cmd == 's':
            print("\nGenerating recursive solution...")
            moves = []
            hanoi_solve(num_disks, 0, 2, 1, moves)
            print(f"Calculated {len(moves)} optimal moves:")
            for idx, (disk, from_p, to_p) in enumerate(moves, 1):
                p_names = ['A', 'B', 'C']
                print(f"  Step {idx:2d}: Move Disk {disk} from Peg {p_names[from_p]} to Peg {p_names[to_p]}")
            print()
            continue

        # Parse moves like "0 2", "A C", "1 3"
        parts = line.replace(",", " ").split()
        if len(parts) == 2:
            p1, p2 = parts[0].upper(), parts[1].upper()
            mapping = {'0': 0, '1': 1, '2': 2, 'A': 0, 'B': 1, 'C': 2}
            from_p = mapping.get(p1)
            to_p = mapping.get(p2)

            if from_p is not None and to_p is not None:
                if from_p == to_p:
                    print("❌ Cannot move disk to the same tower.")
                    continue
                if not pegs[from_p]:
                    print("❌ Selected tower is empty!")
                    continue

                disk_to_move = pegs[from_p][-1]
                if pegs[to_p] and disk_to_move > pegs[to_p][-1]:
                    print(f"❌ Forbidden move! Disk {disk_to_move} is larger than Disk {pegs[to_p][-1]}.")
                    continue

                # Valid move
                pegs[from_p].pop()
                pegs[to_p].append(disk_to_move)
                move_count += 1
                p_names = ['A', 'B', 'C']
                print(f"✅ Moved Disk {disk_to_move} to Peg {p_names[to_p]}!")

                if len(pegs[2]) == num_disks:
                    display_board(pegs, num_disks)
                    print(f"🎉 VICTORY OF THE SAMURAI! You completed {num_disks} disks in {move_count} moves (Optimal: {min_moves})!\n")
                    break
                continue

        print("❌ Unrecognized input. Use format: '0 2' or 'A C', 'h' for hint, 's' for solve, 'q' to quit.")

if __name__ == "__main__":
    main()
