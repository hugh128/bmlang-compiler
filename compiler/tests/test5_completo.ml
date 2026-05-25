/* Test 5 - Programa completo con todas las características */
MAIN{
    DEC a, b, c, resultado;

    INPUT a;
    INPUT b;

    /* Operaciones aritméticas básicas */
    c = a + b * 2;
    resultado = c - 1;

    /* Condicional con comparación y operación lógica */
    IF(a >= b){
        resultado = a ** 2 + b
    }
    ELSE{
        resultado = (a + b) / 2
    };

    OUTPUT resultado
}
