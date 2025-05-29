// App com análise baseada em EMAs, RSI e MACD com interpretação
import React, { useEffect, useState } from 'react';
import { EMA, RSI, MACD } from 'technicalindicators';

const PAIRS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'render-token', symbol: 'RNDR' },
  { id: 'fetch-ai', symbol: 'FET' },
  { id: 'near', symbol: 'NEAR' },
  { id: 'solana', symbol: 'SOL' }
];

export default function App() {
  const [selected, setSelected] = useState(PAIRS[0]);
  const [price, setPrice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [indicadores, setIndicadores] = useState(null);
  const [analiseTexto, setAnaliseTexto] = useState('');

  useEffect(() => {
    const fetchChart = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = \`https://api.coingecko.com/api/v3/coins/\${selected.id}/market_chart?vs_currency=usd&days=30&interval=daily\`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(\`Erro \${res.status}\`);
        const data = await res.json();
        const closes = data.prices.map(p => p[1]);
        const lastClose = closes[closes.length - 1];

        const ema9 = EMA.calculate({ period: 9, values: closes });
        const ema21 = EMA.calculate({ period: 21, values: closes });
        const rsi = RSI.calculate({ period: 14, values: closes });
        const macd = MACD.calculate({
          values: closes,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false
        });

        const rsiUltimo = rsi[rsi.length - 1];
        const macdUltimo = macd[macd.length - 1];
        const direcaoMACD = macdUltimo.MACD > macdUltimo.signal ? 'alta' : 'baixa';
        const tendencia = ema9[ema9.length - 1] > ema21[ema21.length - 1] ? 'alta' : 'baixa';

        const resumo = \`Preço atual: $\${lastClose.toFixed(2)} | RSI: \${rsiUltimo?.toFixed(1)} (\${rsiUltimo > 70 ? 'Sobrecompra' : rsiUltimo < 30 ? 'Sobrevenda' : 'Neutro'}) | EMAs: \${tendencia === 'alta' ? 'EMA9 acima da EMA21 (Alta)' : 'EMA9 abaixo da EMA21 (Baixa)'} | MACD sinaliza \${direcaoMACD}\`;

        let interpretacao = '';
        if (tendencia === 'alta' && direcaoMACD === 'alta' && rsiUltimo < 70) {
          interpretacao = 'Tendência de alta confirmada com impulso positivo. RSI ainda em zona saudável.';
        } else if (tendencia === 'baixa' && direcaoMACD === 'baixa' && rsiUltimo > 30) {
          interpretacao = 'Tendência de baixa continua. Mercado enfraquecido, mas RSI fora de sobrevenda.';
        } else if (rsiUltimo > 70) {
          interpretacao = 'RSI indica sobrecompra. Possível correção à vista, cuidado com entradas tardias.';
        } else if (rsiUltimo < 30) {
          interpretacao = 'RSI em sobrevenda. Pode haver formação de fundo, mas sem confirmação de reversão ainda.';
        } else {
          interpretacao = 'Indicadores mistos. Aguardar mais confirmação antes de entrar.';
        }

        setPrice(lastClose);
        setIndicadores(resumo);
        setAnaliseTexto(interpretacao);
      } catch (err) {
        setError(err.message);
        setPrice(null);
        setIndicadores(null);
        setAnaliseTexto('');
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
  }, [selected]);

  return (
    <div style={{ padding: 30, fontFamily: 'Arial', backgroundColor: '#f1f1f1', minHeight: '100vh' }}>
      <h1>Painel Cripto com Indicadores</h1>
      <select
        value={selected.id}
        onChange={e => setSelected(PAIRS.find(p => p.id === e.target.value))}
        style={{ fontSize: 16, padding: 6 }}
      >
        {PAIRS.map(pair => (
          <option key={pair.id} value={pair.id}>{pair.symbol}</option>
        ))}
      </select>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>Erro: {error}</p>}

      {price && indicadores && (
        <div style={{ backgroundColor: 'white', padding: 20, marginTop: 20, borderRadius: 10, boxShadow: '0 0 8px #ccc' }}>
          <h2>{selected.symbol}/USD</h2>
          <p style={{ fontSize: 24 }}>${price.toFixed(2)}</p>
          <p>{indicadores}</p>
          <p style={{ marginTop: 10, color: '#333' }}><strong>Análise:</strong> {analiseTexto}</p>
        </div>
      )}
    </div>
  );
}
