%{
#include "bmlang.tab.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
%}

%option noyywrap
%option yylineno
%option noinput
%option nounput

%x COMMENT

LETRA    [a-zA-Z]
DIGITO   [0-9]
IDENT    {LETRA}({LETRA}|{DIGITO})*
NUMERO   {DIGITO}+

%%

    /* ---- Gestion de Comentarios ---- */
"/*"                 { BEGIN(COMMENT); }
<COMMENT>"*/"        { BEGIN(INITIAL); }
<COMMENT>.|\n        { /* Ignorar todo lo que esté dentro del comentario */ }
<COMMENT><<EOF>>     { fprintf(stderr, "Error lexico (linea %d): comentario sin cerrar\n", yylineno); 
                        yyterminate(); 
                     }

[ \t\r\n]+    { /* ignorar espacios y saltos */ }

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
                fprintf(stderr, "Error lexico (linea %d): caracter desconocido '%s'\n", yylineno, yytext);
            }

%%
