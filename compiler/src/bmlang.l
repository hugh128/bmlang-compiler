%{
#include "bmlang.tab.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int linea = 1;
%}

%option noyywrap

LETRA    [a-zA-Z]
DIGITO   [0-9]
IDENT    {LETRA}({LETRA}|{DIGITO})*
NUMERO   {DIGITO}+

%%

"/*"    {
            int c;
            while (1) {
                c = input();
                if (c == '\n') linea++;
                if (c == '*') {
                    c = input();
                    if (c == '/') break;
                    if (c == '\n') linea++;
                    if (c == EOF) {
                        fprintf(stderr, "Error lexico (linea %d): comentario sin cerrar\n", linea);
                        break;
                    }
                }
                if (c == EOF) {
                    fprintf(stderr, "Error lexico (linea %d): comentario sin cerrar\n", linea);
                    break;
                }
            }
        }

\n          { linea++; }
[ \t\r]+    { /* ignorar espacios */ }

"MAIN"      { return MAIN;   }
"DEC"       { return DEC;    }
"INPUT"     { return INPUT;  }
"OUTPUT"    { return OUTPUT; }
"IF"        { return IF;     }
"ELSE"      { return ELSE;   }

"&&"        { return AND; }
"||"        { return OR;  }

"<>"        { return NEQ; }
"<="        { return LEQ; }
">="        { return GEQ; }
"<"         { return LT;  }
">"         { return GT;  }
"=="        { return EQ;  }

"**"        { return POW;    }
"+"         { return PLUS;   }
"-"         { return MINUS;  }
"*"         { return TIMES;  }
"/"         { return DIVIDE; }

"="         { return ASSIGN;    }
";"         { return SEMICOLON; }
","         { return COMMA;     }
"("         { return LPAREN;    }
")"         { return RPAREN;    }
"{"         { return LBRACE;    }
"}"         { return RBRACE;    }

{IDENT}     {
                yylval.strval = strdup(yytext);
                return ID;
            }

{NUMERO}    {
                yylval.intval = atoi(yytext);
                return NUM;
            }

.           {
                fprintf(stderr, "Error lexico (linea %d): caracter desconocido '%s'\n", linea, yytext);
            }

%%
