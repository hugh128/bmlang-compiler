%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>

void yyerror(const char *msg);
int  yylex(void);
extern int linea;

/* ── Generador de temporales y etiquetas ── */
static int temp_count  = 0;
static int label_count = 0;

char *new_temp(void) {
    char *buf = malloc(16);
    sprintf(buf, "t%d", ++temp_count);
    return buf;
}

char *new_label(void) {
    char *buf = malloc(16);
    sprintf(buf, "l%d", ++label_count);
    return buf;
}

void emit(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    vprintf(fmt, args);
    va_end(args);
    printf("\n");
}

/* ── Pila de etiquetas para IFs anidados ──
   Permite manejar if-else anidados sin limite fijo */
#define MAX_IF_DEPTH 64
static char *if_else_label[MAX_IF_DEPTH];  /* etiqueta L_ELSE de cada nivel */
static char *if_fin_label[MAX_IF_DEPTH];   /* etiqueta L_FIN  de cada nivel */
static int   if_depth = 0;

%}

%union {
    int   intval;
    char *strval;
}

%token MAIN DEC INPUT OUTPUT IF ELSE
%token AND OR
%token NEQ LEQ GEQ LT GT EQ
%token POW
%token PLUS MINUS TIMES DIVIDE
%token ASSIGN SEMICOLON COMMA LPAREN RPAREN LBRACE RBRACE

%token <intval> NUM
%token <strval> ID

%type <strval> expresion termino factor potencia condicion

%right ASSIGN
%left  OR
%left  AND
%left  EQ NEQ
%left  LT GT LEQ GEQ
%left  PLUS MINUS
%left  TIMES DIVIDE
%right POW
%right UMINUS

%%

/* ── Programa principal ── */
programa
    : MAIN LBRACE bloque RBRACE
        { emit("/* fin de programa */"); }
    ;

/* ── Bloque de sentencias ── */
bloque
    : sentencia otras_sentencias
    ;

otras_sentencias
    : SEMICOLON sentencia otras_sentencias
    | /* vacio */
    ;

sentencia
    : declaracion
    | asignacion
    | lectura
    | escritura
    | condicional
    | /* vacio */
    ;

/* ── Declaracion: DEC a, b, c ── */
declaracion
    : DEC ID otras_variables   { free($2); }
    ;

otras_variables
    : COMMA ID otras_variables  { free($2); }
    | /* vacio */
    ;

/* ── Asignacion ── */
asignacion
    : ID ASSIGN expresion
        {
            emit("%s = %s;", $1, $3);
            free($1); free($3);
        }
    ;

/* ── Lectura ── */
lectura
    : INPUT ID
        {
            emit("call input;");
            emit("pop %s;", $2);
            free($2);
        }
    ;

/* ── Escritura ── */
escritura
    : OUTPUT ID
        {
            emit("push %s;", $2);
            emit("call output;");
            free($2);
        }
    ;

/* ════════════════════════════════════════════════
   IF / IF-ELSE  usando pila de etiquetas
   ════════════════════════════════════════════════
*/

if_inicio
    : IF LPAREN condicion RPAREN
        {
            /* Reservamos etiquetas y las apilamos */
            if_else_label[if_depth] = new_label();
            if_fin_label[if_depth]  = new_label();
            emit("ifZ %s goto %s;", $3, if_else_label[if_depth]);
            free($3);
            if_depth++;
        }
    ;

condicional
    : if_inicio LBRACE bloque RBRACE parte_else
    ;

parte_else
    : ELSE
        {
            /* Fin del bloque THEN */
            if_depth--;
            emit("goto %s;", if_fin_label[if_depth]);
            emit("%s:", if_else_label[if_depth]);
            free(if_else_label[if_depth]);
            if_else_label[if_depth] = NULL;
            if_depth++;
        }
      LBRACE bloque RBRACE
        {
            /* Fin del bloque ELSE */
            if_depth--;
            emit("%s:", if_fin_label[if_depth]);
            free(if_fin_label[if_depth]);
            if_fin_label[if_depth] = NULL;
        }
    | /* sin else */
        {
            if_depth--;
            emit("%s:", if_else_label[if_depth]);
            emit("%s:", if_fin_label[if_depth]);
            free(if_else_label[if_depth]);
            free(if_fin_label[if_depth]);
            if_else_label[if_depth] = NULL;
            if_fin_label[if_depth]  = NULL;
        }
    ;

/* ── Condicion booleana ── */
condicion
    : expresion LT  expresion  { char *t=new_temp(); emit("%s = %s < %s;",  t,$1,$3); free($1);free($3); $$=t; }
    | expresion GT  expresion  { char *t=new_temp(); emit("%s = %s > %s;",  t,$1,$3); free($1);free($3); $$=t; }
    | expresion LEQ expresion  { char *t=new_temp(); emit("%s = %s <= %s;", t,$1,$3); free($1);free($3); $$=t; }
    | expresion GEQ expresion  { char *t=new_temp(); emit("%s = %s >= %s;", t,$1,$3); free($1);free($3); $$=t; }
    | expresion EQ  expresion  { char *t=new_temp(); emit("%s = %s == %s;", t,$1,$3); free($1);free($3); $$=t; }
    | expresion NEQ expresion  { char *t=new_temp(); emit("%s = %s <> %s;", t,$1,$3); free($1);free($3); $$=t; }
    | condicion AND condicion  { char *t=new_temp(); emit("%s = %s && %s;", t,$1,$3); free($1);free($3); $$=t; }
    | condicion OR  condicion  { char *t=new_temp(); emit("%s = %s || %s;", t,$1,$3); free($1);free($3); $$=t; }
    | expresion                { $$ = $1; }
    ;

/* ── Expresiones aritmeticas ── */
expresion
    : expresion PLUS termino
        { char *t=new_temp(); emit("%s = %s + %s;", t,$1,$3); free($1);free($3); $$=t; }
    | expresion MINUS termino
        { char *t=new_temp(); emit("%s = %s - %s;", t,$1,$3); free($1);free($3); $$=t; }
    | termino  { $$ = $1; }
    ;

termino
    : termino TIMES potencia
        { char *t=new_temp(); emit("%s = %s * %s;", t,$1,$3); free($1);free($3); $$=t; }
    | termino DIVIDE potencia
        { char *t=new_temp(); emit("%s = %s / %s;", t,$1,$3); free($1);free($3); $$=t; }
    | potencia { $$ = $1; }
    ;

/* ── Potenciacion ── */
potencia
    : factor POW potencia
        { char *t=new_temp(); emit("%s = %s ** %s;", t,$1,$3); free($1);free($3); $$=t; }
    | factor { $$ = $1; }
    ;

factor
    : LPAREN expresion RPAREN  { $$ = $2; }
    | MINUS factor %prec UMINUS
        { char *t=new_temp(); emit("%s = -%s;", t,$2); free($2); $$=t; }
    | ID    { $$ = $1; }
    | NUM
        {
            char *buf = malloc(16);
            sprintf(buf, "%d", $1);
            $$ = buf;
        }
    ;

%%

void yyerror(const char *msg) {
    fprintf(stderr, "Error sintactico (linea %d): %s\n", linea, msg);
}

int main(int argc, char *argv[]) {
    if (argc > 1) {
        FILE *f = fopen(argv[1], "r");
        if (!f) { perror(argv[1]); return 1; }
        extern FILE *yyin;
        yyin = f;
    }
    return yyparse();
}
