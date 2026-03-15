---
name: peer-analysis
description: Compara métricas financieras clave (valoración, rentabilidad, crecimiento, salud financiera) contra pares de la industria para evaluar valoración relativa e identificar outliers. Se invoca cuando el usuario pide comparación con pares, valoración relativa, "¿cómo se compara X con sus pares?", "¿es X barato/caro respecto a la industria?", o quiere evaluar si una acción está sobrevaluada/subvaluada usando análisis comparativo.
---

## Análisis Comparativo entre Pares para Valoración Relativa

Este skill complementa el análisis fundamental absoluto (como DCF) y el análisis técnico proporcionando herramientas para valoración relativa, esencial para identificar oportunidades de inversión basadas en la valoración del mercado respecto a compañías similares.

## Workflow Checklist

```
Análisis Comparativo Progress:
- [ ] Paso 1: Identificar sector/industria y capitalización de mercado
- [ ] Paso 2: Identificar 5-10 pares comparables
- [ ] Paso 3: Extraer métricas financieras comparables
- [ ] Paso 4: Calcular estadísticas del grupo de pares (media, mediana, percentiles)
- [ ] Paso 5: Posicionar la empresa objetivo dentro del grupo de pares
- [ ] Paso 6: Presentar resultados con tablas, gráficos e interpretación
- [ ] Paso 7: Generar conclusiones de inversión y advertencias
```

## Paso 1: Identificar Sector/Industria y Capitalización de Mercado

**Consulta a `financial_search`:**
```
"[TICKER] company facts"
```

**Extraer:**
- sector
- industry  
- market_cap
- enterprise_value
- outstanding_shares

**Uso:** Determinar el universo de búsqueda para pares comparables (mismo sector y rango similar de market cap).

## Paso 2: Identificar 5-10 Pares Comparables

**Estrategia de búsqueda (usar `financial_search` o `web_search`):**
```
"[INDUSTRY] companies market cap similar to [TICKER] market cap"
"[SECTOR] peers [TICKER] competitors"
"[TICKER] comparable companies analysis"
```

**Criterios de selección:**
- Mismo sector e industria (ideal)
- Market cap dentro de rango 0.5x - 2x del objetivo (ajustable según liquidez)
- Evitar filiales o empresas con estructuras muy diferentes
- Priorizar empresas con datos financieros recientes y completos

**Nota:** Si no se encuentran suficientes pares en el mismo sector, expandir a sectores adyacentes con modelos de negocio similares.

## Paso 3: Extraer Métricas Financieras Comparables

Para cada peer (incluyendo la empresa objetivo), extraer vía `financial_search`:

### Métricas de Valoración:
- P/E Ratio (TTM y Forward)
- Forward P/E
- EV/EBITDA
- EV/Revenue
- Price/Book (P/B)
- Price/Sales (P/S)
- Dividend Yield (si aplica)

### Métricas de Rentabilidad:
- Return on Equity (ROE)
- Return on Invested Capital (ROIC)
- Return on Assets (ROA)
- Net Profit Margin
- Operating Margin
- Gross Margin

### Métricas de Crecimiento:
- Revenue Growth (CAGR 3 años y 5 años)
- EPS Growth (CAGR 3 años y 5 años)
- Book Value Growth
- Free Cash Flow Growth

### Métricas de Salud Financiera:
- Debt-to-Equity Ratio
- Debt-to-EBITDA
- Current Ratio
- Quick Ratio
- Interest Coverage (EBITDA/Interest Expense)
- Free Cash Flow Yield

**Extraer también:**
- Precio actual
- Market Cap
- Enterprise Value
- Para calcular múltiplos si no vienen directamente

## Paso 4: Calcular Estadísticas del Grupo de Pares

Para cada métrica, calcular del grupo de pares (excluyendo outliers extremos si es necesario):
- Media (promedio)
- Mediana (valor central)
- Percentil 25% (Q1)
- Percentil 75% (Q3)
- Rango (mínimo-máximo)
- Desviación estándar (opcional)

**Manejo de outliers:** Considerar eliminar valores fuera de Q1-1.5*IQR a Q3+1.5*IQR para métricas muy sesgadas.

## Paso 5: Posicionar la Empresa Objetivo

Para cada métrica, determinar:
- Valor de la empresa objetivo
- Dónde se ubica respecto al grupo de pares (percentil)
- Si está por encima/debajo de la media/mediana
- Cuántas desviaciones estándar de la media (si se calcula)

**Interpretación general:**
- Para métricas de valoración (P/E, EV/EBITDA, etc.): 
  - Valor bajo = potencialmente subvalorado
  - Valor alto = potencialmente sobrevalorado
  (Contextualizar con crecimiento y rentabilidad)
- Para métricas de rentabilidad (ROE, ROIC, márgenes):
  - Valor alto = ventaja competitiva potencial
  - Valor bajo = posible señal de alerta
- Para métricas de crecimiento:
  - Valor alto = perspectivas de expansión
  - Valor bajo = posible estancamiento
- Para métricas de salud financiera:
  - Valores conservadores = menor riesgo
  - Valores agresivos = mayor riesgo financiero

## Paso 6: Presentar Resultados

### Formato de Salida Recomendado:

```
### Análisis Comparativo entre Pares para [TICKER]

#### 1. Empresa Objetivo y Pares Seleccionados
- **Empresa:** [TICKER] - [Nombre de la Compañía]
- **Sector:** [Sector] | **Industria:** [Industria]
- **Market Cap:** $[Market Cap]B
- **Número de pares analizados:** [N] empresas
- **Pares seleccionados:** [Lista de tickers de pares]

#### 2. Tabla Comparativa de Métricas Clave
| Métrica          | [TICKER] | Promedio Pares | Mediana Pares | Rango Pares (Min-Max) | Percentil [TICKER] |
|------------------|----------|----------------|---------------|-----------------------|-------------------|
| P/E (TTM)        | [valor]  | [valor]        | [valor]       | [min] - [max]         | [percentil]%      |
| EV/EBITDA        | [valor]  | [valor]        | [valor]       | [min] - [max]         | [percentil]%      |
| ROE              | [valor]  | [valor]        | [valor]       | [min] - [max]         | [percentil]%      |
| ROIC             | [valor]  | [valor]        | [valor]       | [min] - [max]         | [percentil]%      |
| Deuda/EBITDA     | [valor]  | [valor]        | [valor]       | [min] - [max]         | [percentil]%      |
| CAGR Ingresos 3y | [valor]  | [valor]        | [valor]       | [min] - [max]         | [percentil]%      |
| Margen Neto      | [valor]  | [valor]        | [valor]       | [min] - [max]         | [percentil]%      |

#### 3. Interpretación por Categoría

**Valoración:**
- [TICKER] está en el [percentil]% de P/E entre sus pares → [interpretación: relativamente barato/caro]
- [TICKER] está en el [percentil]% de EV/EBITDA → [interpretación]

**Rentabilidad:**
- [TICKER] muestra ROE en el [percentil]% → [interpretación: ventaja/desventaja competitiva]
- [TICKER] tiene ROIC en el [percentil]% → [interpretación: creación/destrucción de valor]

**Crecimiento:**
- [TICKER] tiene CAGR de ingresos en el [percentil]% → [interpretación: crecimiento relativo]
- Comparar crecimiento con múltiplos (PEG ratio implícito)

**Salud Financiera:**
- [TICKER] tiene ratio Deuda/EBITDA en el [percentil]% → [interpretación: nivel de apalancamiento]
- Cobertura de intereses: [valor]x → [interpretación: capacidad de servicio de deuda]

#### 4. Conclusiones de Inversión Relativa

**Valoración Relativa:**
- Basado en múltiplos de valoración, [TICKER] parece [subvalorado/sobrevalorado/relativamente justo] respecto a sus pares.
- La prima/descuento implícito es aproximadamente [X]% respecto a la mediana de pares en [métrica principal].

**Calidad vs. Precio:**
- [TICKER] exhibe [alta/media/baja] rentabilidad (ROIC) combinada con [alta/media/baja] valoración.
- Esto sugiere una situación de [acción de calidad a precio razonable/acción de crecimiento caro/acción de valor con riesgos/ trampa de valor].

**Advertencias Estándar:**
- ⚠️ El análisis relativo no sustituye al análisis fundamental absoluto (DCF, etc.).
- ⚠️ Los pares seleccionados pueden no ser perfectamente comparables debido a diferencias en modelos de negocio, geografías o estructuras de capital.
- ⚠️ Los múltiplos de valoración deben interpretarse en conjunto con tasas de crecimiento y perfiles de riesgo.
- ⚠️ Revisar siempre las definiciones específicas de cada métrica (ej. P/E TTM vs Forward).
```

## Paso 7: Generar Conclusiones de Inversión y Advertencias

### Preguntas Clave para Responder:
1. **¿La empresa objetivo está consistentemente por encima o debajo de la mediana en múltiples categorías?**
2. **¿Hay alguna métrica donde sea un outlier extremo (muy alto o muy bajo)?**
3. **¿La valoración relativa es coherente con las perspectivas de crecimiento y rentabilidad?**
4. **¿Qué implica el posicionamiento para una estrategia de inversión (valor, crecimiento, ingresos, etc.)?**

### Formato de Recomendación:
- **Estrategia Sugerida:** [Valor/Crecimiento/Ingresos/Equilibrado]
- **Razonamiento:** [Breve explicación basada en el análisis comparativo]
- **Nivel de Confianza:** [ALTA/MEDIA/BAJA] basado en calidad de pares y consistencia de señales
- **Áreas de Investigación Adicional:** [Temas que requieren análisis más profundo]

### Advertencias Específicas del Análisis Comparativo:
- ⚠️ "Las empresas dentro de un mismo sector pueden tener diferencias significativas en modelos de negocio, ventaja competitiva y exposición geográfica."
- ⚠️ "Un múltiplo bajo puede reflejar problemas fundamentales no capturados en métricas superficiales."
- ⚠️ "La mediana puede ser engañosa si el grupo de pares está sesgado hacia empresas muy grandes o muy pequeñas."
- ⚠️ "Siempre verificar la fecha y fiscal year de los datos financieros para asegurar comparabilidad."
```

## Notas de Implementación para el Agente

Al ejecutar este skill, el agente debería:
1. Usar `financial_search` para obtener datos de compañía y pares
2. Considerar usar `web_search` para buscar listas de pares cuando `financial_search` sea limitado
3. Validar que los pares seleccionados tengan datos financieros recientes y completos
4. Presentar números con precisión apropiada (2 decimales para ratios, 1 para porcentajes)
5. Usar formato de tabla markdown para claridad
6. Señalar claramente cuándo se hacen ajustes o exclusiones en el grupo de pares