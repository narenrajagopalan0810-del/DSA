CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra
LIBS = -lws2_32

all: hanoi_server hanoi_cli

hanoi_server: server.c hanoi.c hanoi.h
	$(CC) $(CFLAGS) server.c hanoi.c -o hanoi_server $(LIBS)

hanoi_cli: hanoi_cli.c hanoi.c hanoi.h
	$(CC) $(CFLAGS) hanoi_cli.c hanoi.c -o hanoi_cli

clean:
	rm -f hanoi_server hanoi_server.exe hanoi_cli hanoi_cli.exe *.o

.PHONY: all clean
