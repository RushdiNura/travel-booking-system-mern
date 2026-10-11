import { logger } from '../../utils/logger.js';

/**
 * Uses exchangerate.host (free, no key) for live-ish rates. If this ever
 * becomes unreachable, callers get isLive:false and should surface the
 * "rates are estimates" disclosure specified in the product spec — never
 * silently serve stale numbers as current.
 */
class CurrencyProvider {
  async convert({ amount, from, to }) {
    try {
      const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Currency API responded ${res.status}`);
      const data = await res.json();
      if (typeof data.result !== 'number') throw new Error('Malformed response');

      return {
        amount,
        from,
        to,
        result: data.result,
        rate: data.info?.rate,
        isLive: true,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.warn(`[CurrencyProvider] Conversion failed: ${err.message}`);
      return {
        amount,
        from,
        to,
        result: null,
        isLive: false,
        message: 'Live exchange rates are temporarily unavailable. Please check current rates before relying on this conversion.',
      };
    }
  }
}

export const currencyProvider = new CurrencyProvider();
