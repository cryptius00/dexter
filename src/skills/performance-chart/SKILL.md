---
name: performance-chart
description: Genera una gráfica comparativa de rendimiento relativo para acciones y criptomonedas principales sobre un período especificado. Muestra visualmente cómo se han desempeñado diferentes activos entre sí, ideal para identificar líderes y rezagados, tendencias de momentum y divergencias. Se invoca cuando el usuario pide ver rendimiento comparativo, gráfica de rendimiento, "¿cómo ha performado X vs Y?", "mostrar gráfico de comparación", o quiere analizar momentum relativo entre múltiples activos.
---

## Gráfica Comparativa de Rendimiento Relativo

Esta habilidad genera una visualización en terminal que muestra el rendimiento relativo de múltiples activos (acciones y criptomonedas) sobre un período de tiempo especificado, permitiendo identificar rápidamente tendencias de momentum, líderes del mercado y divergencias entre sectores.

## Workflow Checklist

```
Gráfica de Rendimiento Progress:
- [ ] Paso 1: Definir activos a comparar (acciones y/o criptos)
- [ ] Paso 2: Seleccionar período de tiempo (1M, 3M, 6M, YTD, 1A, etc.)
- [ ] Paso 3: Obtener precios históricos ajustados para cada activo
- [ ] Paso 4: Normalizar todos los precios a 100 en el punto de partida
- [ ] Paso 5: Calcular rendimiento relativo por período
- [ ] Paso 6: Generar gráfica ASCII/Unicode de líneas comparativas
- [ ] Paso 7: Presentar tabla de rendimiento porcentual e interpretación
```

## Paso 1: Definir Activos a Comparar

**Acciones Tradicionales (por defecto si no se especifica):**
- **Tecnología Grande:** AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA
- **Financieros:** JPM, BAC, WFC, C, GS
- **Salud:** JNJ, PFE, UNH, MRK, ABBV
- **Consumo Básico:** PG, KO, PEP, WMT, COST
- **Energía:** XOM, CVX, COP, EOG
- **Industriales:** CAT, HON, UPS, RTX, LMT

**Criptomonedas Relevantes (Top por capitalización y liquidez):**
- **BTC** (Bitcoin) - Oro digital, reserva de valor
- **ETH** (Ethereum) - Plataforma de contratos inteligentes líder
- **BNB** (Binance Coin) - Token del exchange más grande
- **USDC** (USD Coin) - Stablecoin regulada (para referencia)
- **SOL** (Solana) - Alta velocidad y bajo costo
- **XRP** (Ripple) - Pagos transfronterizos
- **ADA** (Cardano) - Enfoque académico y escalabilidad
- **DOGE** (Dogecoin) - Memecoin con fuerte comunidad (opcional)
- **AVAX** (Avalanche) - Competidor de Ethereum rápido
- **DOT** (Polkadot) - Interoperabilidad entre cadenas

**Nota:** El skill prioriza las 3-5 criptomonedas más relevantes por defecto (BTC, ETH, BNB, SOL, XRP) a menos que se especifique lo contrario.

## Paso 2: Seleccionar Período de Tiempo

**Opciones de período (usar formato estándar):**
- `1M` = Último mes
- `3M` = Últimos 3 meses  
- `6M` = Últimos 6 meses (por defecto)
- `YTD` = Desde inicio del año
- `1A` = Último año
- `3A` = Últimos 3 años
- `5A` = Últimos 5 años

**Formato de consulta:** Puedes especificar directamente como: `"AAPL, MSFT, BTC, ETH rendimiento último 3 meses"`

## Paso 3: Obtener Precios Históricos Ajustados

**Consulta a `financial_search` para cada activo:**
```
"[ACTIVO] monthly adjusted close prices for the last [PERIODO]"
```

**Para criptomonedas:** El mismo enfoque funciona ya que financial_search incluye datos de cripto principales.

**Extraer:**
- Array de precios de cierre ajustados (dividendos y splits ya considerados para acciones)
- Fechas correspondientes (para etiquetado temporal)
- Mínimo 6 puntos de datos para períodos significativos

## Paso 4: Normalizar Precios

**Fórmula de normalización (hacer que todos empiecen en 100):**
```
Precio Normalizado = (Precio Actual / Primer Precio del Período) × 100
```

**Ejemplo:**
- Si AAPL empieza en $150 y termina en $180: Normalizado va de 100 a 120 (+20%)
- Si BTC empieza en $25,000 y termina en $30,000: Normalizado va de 100 a 120 (+20%)
- Esto permite comparación directa pese a diferentes rangos de precios

## Paso 5: Calcular Rendimiento Relativo por Período

**Dividir el período en intervalos iguales (por ejemplo, 6 bloques para 6 meses):**
- Para cada intervalo, calcular el precio normalizado promedio
- Esto suaviza la volatilidad mensual para mostrar tendencia clara

**Alternative para mayor detalle:** Mostrar puntos mensuales individuales si el período lo permite (<12 meses)

## Paso 6: Generar Gráfica ASCII/Unicode de Líneas Comparativas

**Bloques de Caracteres Unicode para resolución fina:**
- ▁ (1/8) ▂ (2/8) ▃ (3/8) ▄ (4/8) ▅ (5/8) ▆ (6/8) ▇ (7/8) █ (8/8)
- Permite mostrar 8 niveles de resolución por carácter

**Escalado del eje Y:**
- Determinar rango de valores normalizados (ej: 80 a 130)
- Mapear este rango a 8 niveles de bloques
- Cada fila representa un nivel de rendimiento relativo

**Construcción de la gráfica:**
1. Para cada intervalo de tiempo (de izquierda a derecha):
2. Para cada activo (de arriba a abajo):
3. Calcular qué bloque usar basado en su posición normalizada
4. Construir línea por línea desde arriba hacia abajo

**Ejemplo de salida visual:**
```
RENDIMIENTO RELATIVO (ÚLTIMOS 6 MESES)  [Base = 100]
130 ┤                                     ║
125 ┤                                     ║  █
120 ┤                 ║                 ║  █  █
115 ┤        ║        ║  █        ║  █  █  █
110 ┤  ║  █  ║  █  █  ║  █  █  ║  █  █  █  █
105 ┤  █  █  █  █  █  █  █  █  █  █  █  █  █  █
100 ┼──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┼→ Tiempo
     AAPL  MSFT  GOOGL  AMZN   META   NVDA   TSLA
```
*Nota: Esta es una representación conceptual - el output real será más compacto*

## Paso 7: Presentar Resultados Estructurados

### Formato de Salida Recomendado:

```
### Gráfica Comparativa de Rendimiento Relativo

#### Activos Analizados y Período
- **Acciones:** [Lista de tickers de acciones]
- **Criptomonedas:** [Lista de tickers de cripto] 
- **Período:** [Descripción del período, ej. "Últimos 6 meses (Oct 2025 - Mar 2026)"]
- **Base:** Todos los activos normalizados a 100 al inicio del período

#### Gráfica de Rendimiento
[Gráfica ASCII/Unicode aquí - ver ejemplo conceptual arriba]

#### Tabla de Rendimiento Porcentual
| Activo | Inicio | Fin | % Cambio | Rendimiento vs Promedio |
|--------|--------|-----|----------|-------------------------|
| AAPL   | $150.00| $180.00| +20.0%  | +5.2% (arriba del promedio) |
| MSFT   | $280.00| $320.00| +14.3%  | -0.5% (ligeramente abajo) |
| BTC    | $25,000| $32,000| +28.0%  | +13.2% (muy arriba) |
| ETH    | $1,800 | $2,000 | +11.1%  | -3.7% (ligeramente abajo) |
| ...    | ...    | ...  | ...      | ...                     |

#### Interpretación de Tendencias
- **Líderes de Momentum:** [Activos con mejor rendimiento]
- **Rezagados:** [Activos con peor rendimiento]
- **Tendencias del Sector:** [Observaciones como "Tecnología superando a Finanzas"]
- **Divergencias Clave:** [Activos que se mueven en dirección opuesta a su sector]

#### Métricas Adicionales
- **Volatilidad Promedio:** [Desviación estándar de los cambios periódicos]
- **Correlación Promedio:** [Qué tan seguido se mueven juntos los activos]
- **Activo Más Volátil:** [Ticker con mayor desviación estándar]
- **Activo Más Estable:** [Ticker con menor desviación estándar]

#### Advertencias Estándar
- ⚠️ El rendimiento pasado no garantiza resultados futuros
- ⚠️ Las criptomonedas presentan volatilidad significativamente mayor que las acciones tradicionales
- ⚠️ Esta gráfica muestra rendimiento relativo, no precios absolutos
- ⚠️ Considerar comisiones, impuestos y slippage al operar
- ⚠️ Para criptomonedas: tener en cuenta riesgos regulatorios y de custodia
```

## Notas de Implementación para el Agente

Al ejecutar este skill, el agente debería:
1. **Parsear inteligentemente la solicitud** para extraer:
   - Lista de activos (acciones y/o criptos)
   - Período de tiempo especificado
   - Enfoque (por ejemplo, "solo criptos" o "comparar tech vs energía")
2. **Usar `financial_search`** para obtener datos históricos de cada activo:
   - Consultas como `"[TICKER] monthly adjusted close prices for the last 6 months"`
   - Para múltiples activos, puede hacer consultas en paralelo o secuencial
3. **Validar y limpiar datos**:
   - Verificar que se obtengan suficientes puntos de datos (≥6 para análisis significativo)
   - Manejar casos donde algún activo no tenga datos disponibles
   - Normalizar fechas para asegurar comparabilidad temporal
4. **Aplicar la lógica de normalización y cálculo de rendimiento**
5. **Generar la gráfica usando bloques Unicode** (▁▂▃▄▅▆▇█) para máxima resolución en terminal
6. **Presentar resultados en el formato estructurado de arriba**
7. **Incluir interpretaciones útiles** más allá de solo mostrar números

## Ejemplos de Consultas Válidas:
- "Muestra un gráfico de rendimiento comparativo de AAPL, MSFT, GOOGL para los últimos 3 meses"
- "Comparar BTC, ETH, SOL en el último año"
- "¿Cómo ha performado el sector tech vs energía en los últimos 6 meses? Incluir AAPL, MSFT, XOM, CVX"
- "Gráfica de rendimiento YTD para las 5 criptomonedas más grandes por market cap"
- "Mostrar cómo se han desempeñado las acciones de bancos vs criptomonedas en el último mes"

## Limitaciones y Consideraciones Técnicas:
- **Resolución temporal:** Máximo ~24 puntos para gráficas legibles en terminal (ej: 2 años con intervalos mensuales)
- **Número de activos:** Recomendado 3-6 activos para claridad visual (más se vuelve difícil de distinguir)
- **Actualización de datos:** Depende de la frecuencia de actualización de financial_search (generalmente diaria para acciones, horaria para cripto)
- **Divisas:** Todas las valorizaciones en USD para comparabilidad directa
- **Dividends y Splits:** Ya considerados en precios ajustados de financial_search para acciones