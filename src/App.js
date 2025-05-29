// Versão atualizada com nome do ativo, preço atual, indicadores 4h/1D/1S e análise baseada nos dados do 1D
import React, { useEffect, useState } from 'react';
import { EMA, RSI, MACD } from 'technicalindicators';

const PAIRS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'render-token', symbol: 'RNDR', name: 'Render' },
  { id: 'fetch-ai', symbol: 'FET', name: 'Fetch.ai' },
  { id: 'near', symbol: 'NEAR', name: 'Near Protocol' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' }
];

const TIMEFRAMES = [
  { label: '4h', days: 2, interval: 'hourly' },
  { label: '1D', days: 30, interval: 'daily' },
  { label: '1S', days: 90, interval: 'daily' }
];

export default function App() {
  const [selected, setSelected] = useState(PAIRS[0]);
  const [indicadores, setIndicadores] = useState({});
  const [analiseTexto, setAnaliseTexto] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const results = {};
      try {
        for (let tf of TIMEFRAMES) {
          const url = `https://api.coingecko.com/api/v3/coins/${selected.id}/market_chart?vs_currency=usd&days=${tf.days}&interval=${tf.interval}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Erro ${res.status}`);
          const data = await res.json();
          const closes = data.prices.map(p => p[1]);

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

          const lastClose = closes[closes.length - 1];
          const rsiUltimo = rsi[rsi.length - 1];
          const macdUltimo = macd[macd.length - 1];
          const direcaoMACD = macdUltimo.MACD > macdUltimo.signal ? 'alta' : 'baixa';
          const tendencia = ema9[ema9.length - 1] > ema21[ema21.length - 1] ? 'alta' : 'baixa';

          results[tf.label] = {
            preco: lastClose,
            rsi: rsiUltimo?.toFixed(1),
            direcaoMACD,
            tendencia,
            resumo: `Preço: $${lastClose.toFixed(2)} | RSI: ${rsiUltimo?.toFixed(1)} (${rsiUltimo > 70 ? 'Sobrecompra' : rsiUltimo < 30 ? 'Sobrevenda' : 'Neutro'}) | EMAs: ${tendencia === 'alta' ? 'EMA9 > EMA21' : 'EMA9 < EMA21'} | MACD: ${direcaoMACD}`
          };
        }

        const d = results['1D'];
        let interpretacao = '';
        const rsiVal = parseFloat(d.rsi);
        if (d.tendencia === 'alta' && d.direcaoMACD === 'alta' && rsiVal < 70) {
          interpretacao = 'Tendência de alta confirmada com impulso positivo e RSI saudável.';
        } else if (d.tendencia === 'baixa' && d.direcaoMACD === 'baixa' && rsiVal > 30) {
          interpretacao = 'Mercado enfraquecido, tendência de baixa ainda presente.';
        } else if (rsiVal > 70) {
          interpretacao = 'RSI em sobrecompra. Risco de correção no curto prazo.';
        } else if (rsiVal < 30) {
          interpretacao = 'RSI em sobrevenda. Possível ponto de reversão, mas sem confirmação.';
        } else {
          interpretacao = 'Indicadores mistos. Aguarde confirmação antes de agir.';
        }

        setIndicadores(results);
        setAnaliseTexto(interpretacao);
      } catch (err) {
        setError(err.message);
        setIndicadores({});
        setAnaliseTexto('');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selected]);

  return (
    <div style={{ padding: 30, fontFamily: 'Arial', backgroundColor: '#f2f2f2', minHeight: '100vh' }}>
      <h1>Painel Cripto</h1>
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

      {!loading && indicadores && (
        <div style={{ marginTop: 30 }}>
          <h2>{selected.name} ({selected.symbol})</h2>
          <p style={{ fontSize: 22, fontWeight: 'bold' }}>
            Preço atual: ${indicadores['1D']?.preco?.toFixed(2)}
          </p>
          {Object.entries(indicadores).map(([tf, info]) => (
            <div key={tf} style={{ backgroundColor: 'white', marginBottom: 20, padding: 20, borderRadius: 10, boxShadow: '0 0 6px #ccc' }}>
              <h3>Timeframe: {tf}</h3>
              <p>{info.resumo}</p>
            </div>
          ))}
          <div style={{ marginTop: 20 }}>
            <strong>Análise com base no Diário (1D):</strong>
            <p>{analiseTexto}</p>
          </div>
        </div>
      )}
    </div>
  );
}