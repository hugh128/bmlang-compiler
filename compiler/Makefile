# ═══════════════════════════════════════════════════════════════
#  Makefile — Compilador BMLang
#  Uso:
#    make          → compila el compilador
#    make test     → corre todos los archivos en tests/
#    make clean    → elimina archivos generados
# ═══════════════════════════════════════════════════════════════

CC      = gcc
CFLAGS  = -Wall -g

SRC     = src
BIN     = bin
TESTS   = tests

# Nombre del binario final
TARGET  = $(BIN)/bmlang

# Archivos generados por flex y bison
BISON_C = $(SRC)/bmlang.tab.c
BISON_H = $(SRC)/bmlang.tab.h
FLEX_C  = $(SRC)/lex.yy.c

.PHONY: all test clean

# ─── Compilación principal ───────────────────────────────────
all: $(TARGET)

# 1. bison genera bmlang.tab.c y bmlang.tab.h
$(BISON_C) $(BISON_H): $(SRC)/bmlang.y
	bison -d -o $(BISON_C) $(SRC)/bmlang.y

# 2. flex genera lex.yy.c (necesita el .tab.h para los tokens)
$(FLEX_C): $(SRC)/bmlang.l $(BISON_H)
	flex -o $(FLEX_C) $(SRC)/bmlang.l

# 3. gcc compila todo en un solo binario
$(TARGET): $(BISON_C) $(FLEX_C) | $(BIN)
	$(CC) $(CFLAGS) -o $(TARGET) $(BISON_C) $(FLEX_C) -lfl

$(BIN):
	mkdir -p $(BIN)

# ─── Tests ───────────────────────────────────────────────────
test: $(TARGET)
	@echo ""
	@echo "═══════════════════════════════════════"
	@echo "  Corriendo tests en $(TESTS)/"
	@echo "═══════════════════════════════════════"
	@for f in $(TESTS)/*.ml; do \
		echo ""; \
		echo "─── $$f ───────────────────────────────"; \
		./$(TARGET) $$f; \
		echo ""; \
	done

# ─── Limpieza ────────────────────────────────────────────────
clean:
	rm -f $(BISON_C) $(BISON_H) $(FLEX_C) $(BIN)/bmlang
