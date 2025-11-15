-- Script para limpiar compromisos duplicados en la base de datos
-- Este script elimina registros duplicados manteniendo solo el más reciente

-- PASO 1: Identificar duplicados en compsemanal
-- (Mismo IdUsuario, Factor, y Regis_Fecha)
SELECT
    IdUsuario,
    Factor,
    Regis_Fecha,
    COUNT(*) as cantidad,
    GROUP_CONCAT(IdCompromiso ORDER BY IdCompromiso) as ids
FROM compsemanal
GROUP BY IdUsuario, Factor, Regis_Fecha
HAVING COUNT(*) > 1;

-- PASO 2: Eliminar duplicados de compsemanal (mantener el más reciente)
-- IMPORTANTE: Ejecutar esto solo después de revisar los duplicados con la consulta anterior
DELETE t1 FROM compsemanal t1
INNER JOIN compsemanal t2
WHERE
    t1.IdUsuario = t2.IdUsuario
    AND t1.Factor = t2.Factor
    AND t1.Regis_Fecha = t2.Regis_Fecha
    AND t1.IdCompromiso < t2.IdCompromiso;

-- PASO 3: Verificar que no queden duplicados
SELECT
    IdUsuario,
    Factor,
    Regis_Fecha,
    COUNT(*) as cantidad
FROM compsemanal
GROUP BY IdUsuario, Factor, Regis_Fecha
HAVING COUNT(*) > 1;

-- PASO 4: Limpiar registros huérfanos en registroCompromiso
-- (Registros que apuntan a compromisos que ya no existen)
DELETE FROM registroCompromiso
WHERE IdCompromiso NOT IN (SELECT IdCompromiso FROM compsemanal);

-- PASO 5: Verificar integridad de los datos
SELECT
    c.IdUsuario,
    u.Correo,
    c.Factor,
    c.Regis_Fecha,
    COUNT(r.IdRegistro) as checks_count
FROM compsemanal c
LEFT JOIN usuarios u ON c.IdUsuario = u.IdUsuario
LEFT JOIN registroCompromiso r ON c.IdCompromiso = r.IdCompromiso
GROUP BY c.IdCompromiso
ORDER BY c.IdUsuario, c.Regis_Fecha, c.Factor;
