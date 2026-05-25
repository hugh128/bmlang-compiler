/* Test 6 - IFs anidados para probar la pila de etiquetas */
MAIN{
    DEC x, y, resultado;
    INPUT x;
    INPUT y;
    IF(x > 0){
        IF(y > 0){
            resultado = x + y
        }
        ELSE{
            resultado = x
        }
    }
    ELSE{
        resultado = 0
    };
    OUTPUT resultado
}
