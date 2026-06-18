# PLANTILLA ACTA DE PRUEBAS FUNCIONALES - SIGAH

**Fecha:** [DD/MM/AAAA]  
**Hora:** [HH:MM - HH:MM] (UTC-05:00)  
**Duración:** [X minutos]  
**Lugar:** [Ambiente de pruebas / IP / URL]  

---

## PARTICIPANTES

| Rol | Nombre/Identificación | Responsabilidad |
|-----|----------------------|-----------------|
| **Tester / Usuario Funcional** | [Nombre] | Ejecutor de pruebas manuales, validación de comportamiento esperado |
| **Desarrollador / Soporte Técnico** | [Nombre] | Preparación de ambiente, guía de pruebas, verificación técnica |

---

## OBJETIVO DE LA SESIÓN

[Describir el objetivo específico de las pruebas, qué módulo o funcionalidad se está validando]

---

## AMBIENTE DE PRUEBAS

| Componente | URL / Ubicación | Estado |
|-----------|-----------------|--------|
| Frontend SIGAH | [URL] | [ ] Operativo [ ] No disponible |
| Backend API | [URL] | [ ] Operativo [ ] No disponible |
| Base de Datos | [Nombre BD] | [ ] Operativo [ ] No disponible |
| Usuario de Prueba | [Usuario / Contraseña] | [ ] Activo [ ] Inactivo |

---

## CASOS DE PRUEBA EJECUTADOS

### 1. [Nombre del Caso de Prueba 1]
**Descripción:** [Breve descripción de qué se prueba]

**Pasos:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado Esperado:** [Qué se espera que ocurra]

**Resultado Obtenido:** [ ] **PASS** - [Descripción del resultado]  
[ ] **FAIL** - [Descripción del error]

**Evidencia:** [Screenshot / Archivo adjunto]

---

### 2. [Nombre del Caso de Prueba 2]
**Descripción:** [Breve descripción]

**Pasos:**
1. [Paso 1]
2. [Paso 2]

**Resultado Esperado:** [Descripción]

**Resultado Obtenido:** [ ] **PASS** / [ ] **FAIL**

---

### 3. [Nombre del Caso de Prueba 3 - CRÍTICO si aplica]
**Descripción:** [Marcar si es prueba crítica]

**Pasos:**
1. [Paso 1]
2. [Paso 2]

**Resultado Esperado:** [Descripción]

**Resultado Obtenido:** [ ] **PASS** / [ ] **FAIL**

---

## RESUMEN DE RESULTADOS

| Caso de Prueba | Estado | Severidad |
|----------------|--------|-----------|
| [Caso 1] | [ ] PASS [ ] FAIL | [Normal/Alta/Crítica] |
| [Caso 2] | [ ] PASS [ ] FAIL | [Normal/Alta/Crítica] |
| [Caso 3] | [ ] PASS [ ] FAIL | [Normal/Alta/Crítica] |

**Tasa de Éxito:** [X/Y (XX%)]

---

## HALLAZGOS Y OBSERVACIONES

### ✅ Correcciones Verificadas
- [ ] [Descripción de corrección validada]
- [ ] [Descripción de corrección validada]

### 📝 Recomendaciones
- [ ] [Recomendación 1]
- [ ] [Recomendación 2]

### ❌ Bugs Encontrados (si aplica)
| # | Descripción | Severidad | Pasos para reproducir |
|---|-------------|-----------|----------------------|
| 1 | | | |
| 2 | | | |

---

## CONCLUSIÓN

[El módulo de **XXXX** de SIGAH ha sido validado / presenta problemas que requieren corrección].

[Detalles adicionales sobre el estado del sistema]

**El sistema está [APTO / NO APTO] para uso operativo** en lo relacionado con [funcionalidad probada].

---

## FIRMAS Y APROBACIÓN

| Rol | Firma | Fecha |
|-----|-------|-------|
| Tester / Usuario Funcional | ___________________ | [DD/MM/AAAA] |
| Desarrollador / Soporte Técnico | ___________________ | [DD/MM/AAAA] |

---

## ANEXOS

- Anexo A: Screenshots de pruebas
- Anexo B: Archivos de checklist de pruebas
- Anexo C: Scripts de preparación de ambiente
- Anexo D: Backups de base de datos

---

**Documento generado el [DD/MM/AAAA]**  
**Versión:** [X.X]  
**Ubicación:** `[RUTA_DEL_ARCHIVO]`

---

## NOTAS DE USO DE ESTA PLANTILLA

1. **Copiar** esta plantilla para cada nueva sesión de pruebas
2. **Renombrar** con formato: `ACTA-PRUEBAS-[MODULO]-[AAAA-MM-DD].md`
3. **Completar** todos los campos marcados con [corchetes]
4. **Marcar** checkboxes con [x] para indicar PASS/FAIL
5. **Guardar** en ubicación compartida del proyecto
6. **Commit** a GitHub junto con código relacionado

## REFERENCIA: ACTA EJEMPLO COMPLETADA

Ver archivo de referencia: `ACTA-PRUEBAS-KITS-2024-06-18.md`
- Módulo: Kits de Ayuda Humanitaria
- Resultado: 5/5 pruebas PASS (100%)
- Hallazgo clave: Corrección de inconsistencia 44 vs 3 en disponibilidad
