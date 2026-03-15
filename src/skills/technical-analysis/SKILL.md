---
name: technical-analysis
description: Calcula indicadores técnicos (RSI, MACD, Bandas de Bollinger) y identifica señales de sobrecompra/sobreventa, cruces de medias y rupturas de volatilidad para optimizar timing de entrada/salida en inversiones. Se invoca cuando el usuario pide análisis técnico, indicadores, RSI, MACD, sobrecompra, sobreventa, tendencias, momentum o quiere optimizar el timing de una inversión ya valorada fundamentalmente.
---

## Análisis Técnico para Timing de Inversiones

Este skill complementa el análisis fundamental (como DCF) proporcionando herramientas para optimizar el timing de entrada y salida basado en patrones de precio y momentum.

## Workflow Checklist

```
Análisis Técnico Progress:
- [ ] Paso 1: Obtener datos históricos de precios
- [ ] Paso 2: Calcular indicadores clave (RSI, MACD, Bollinger)
- [ ] Paso 3: Identificar señales de trading
- [ ] Paso 4: Validar con volumen y contexto de mercado
- [ ] Paso 5: Presentar resultados con niveles de acción
```

## Paso 1: Obtener Datos Históricos de Precios

**Consulta a `financial_search`:**
```
"[TICKER] daily close prices for the last 50 days"
```

**Extraer:**
- Array de precios de cierre ordenados cronológicamente (más antiguo primero)
- Mínimo 30 puntos de datos para cálculos significativos
- Opcional: volumen para validación de señales

## Paso 2: Calcular Indicadores Clave

Usar las fórmulas estándar para generar:
- **RSI(14)**: Identificar sobrecompra (>70) y sobreventa (<30)
- **MACD(12,26,9)**: 
  - Línea MACD cruzando por encima de la señal = señal alcista
  - Línea MACD cruzando por debajo de la señal = señal bajista
  - Histograma creciente/decreciente = fortalecimiento/debilitación de tendencia
- **Bandas de Bollinger(20,2)**:
  - Precio tocando banda superior = posible sobrecompra
  - Precio tocando banda inferior = posible sobreventa
  - Anchura de bandas baja = baja volatilidad (posible ruptura inminente)

## Paso 3: Identificar Señales de Trading

Generar señales claras con niveles de confianza:

### Señales Alcistas (Confianza Alta):
- RSI subiendo desde debajo de 30 (salida de sobreventa)
- MACD cruzando por encima de su señal (especialmente si está debajo de cero)
- Precio rebotando desde la banda inferior de Bollinger con volumen creciente

### Señales Bajistas (Confianza Alta):
- RSI bajando desde encima de 70 (entrada a sobrecompra)
- MACD cruzando por debajo de su señal (especialmente si está encima de cero)
- Precio siendo rechazado por la banda superior de Bollinger con volumen alto

### Señales Neutrales/Cautela:
- RSI entre 40-60 sin dirección clara
- MACD y señal entrelazadas (sin cruzadas definidas)
- Precio moviéndose dentro de las bandas sin tocar extremos

## Paso 4: Validar Contexto

Antes de presentar señales, verificar:
- **Volumen**: Las señales son más fuertes con volumen por encima del promedio 20d
- **Tendencia mayor**: En mercados bajistas fuertes, esperar confirmación adicional para señales alcistas
- **Eventos imminentes**: Evitar operar cerca de resultados trimestrales, announcements de Fed, etc. (usar calendario financiero si está disponible)

## Paso 5: Formato de Salida

Presentar un resumen estructurado incluyendo:

1. **Resumen de Indicadores Actuales**:
   - RSI: [valor] ([interpretación: Sobrecompra/Neutral/Sobreventa])
   - MACD: [valor] | Señal: [valor] | Histograma: [valor] ([interpretación: Alcista/Bajista/Neutral])
   - Precio vs Bandas: [posición relativa a bandas superior/media/inferior]

2. **Señal de Trading**:
   - Acción: COMPRAR / VENDER / ESPERAR
   - Nivel de Confianza: ALTA / MEDIA / BAJA
   - Precio de Entrada Sugerido: [precio actual o nivel clave]
   - Stop Loss Sugerido: [nivel basado en soporte reciente o volatilidad]
   - Take Profit Sugerido: [nivel basado en resistencia reciente o razón riesgo/beneficio]

3. **Advertencias Estándar**:
   - "Los indicadores técnicos no deben usarse aislados; combinar con análisis fundamental"
   - "El rendimiento pasado no garantiza resultados futuros"
   - "Considerar siempre la tolerancia al riesgo y horizonte de inversión"

## Ejemplo de Output
```
### Análisis Técnico para AAPL

#### Indicadores Actuales (Cierre: $172.34)
- RSI(14): 38.2 → Neutral ligeramente alcista (salida de territorio de sobreventa)
- MACD: -0.82 | Señal: -1.15 | Histograma: 0.33 → Señal alcista temprana (MACD por encima de señal)
- Bandas BB(20,2): Superior=$178.50 | Media=$172.10 | Inferior=$165.70
  → Precio ligeramente por encima de la media, acercándose a banda superior

#### Señal de Trading
- Acción: COMPRAR (Confianza: MEDIA)
- Entrada Sugerida: $172.00 - $173.00
- Stop Loss: $168.00 (soporte reciente en mínimos de 2 semanas)
- Take Profit: $180.00 (objetivo banda superior + razón 2:1 riesgo/beneficio)

#### Contexto y Advertencias
- Volumen actual: 15% por debajo del promedio 20d → Validar con próximos días
- Tendencia mayor: Lateral en rango $160-$180 durante última semana
- ⚠️ Recuerde: Use esto como complemento a su análisis fundamental (DCF, etc.). No operar basado únicamente en indicadores técnicos.
```