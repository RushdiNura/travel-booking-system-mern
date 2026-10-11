import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Uses Open-Meteo (no API key required) when no WEATHER_API_KEY is set,
 * since it provides real forecast data for free. If WEATHER_API_KEY is
 * configured, callers can extend this to use a paid provider (e.g.
 * OpenWeatherMap) for richer data. Either way, the response always makes
 * clear it's live data — never fabricated.
 */
class WeatherProvider {
  isConfigured() {
    return true; // Open-Meteo requires no key; always usable.
  }

  async getForecast({ lat, lng }) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather API responded ${res.status}`);
      const data = await res.json();

      return {
        source: 'open-meteo',
        current: {
          temperatureC: data.current?.temperature_2m,
          conditionCode: data.current?.weather_code,
        },
        daily: (data.daily?.time || []).map((date, i) => ({
          date,
          maxC: data.daily.temperature_2m_max[i],
          minC: data.daily.temperature_2m_min[i],
          conditionCode: data.daily.weather_code[i],
        })),
      };
    } catch (err) {
      logger.warn(`[WeatherProvider] Forecast fetch failed: ${err.message}`);
      return { source: 'unavailable', error: 'Weather data is temporarily unavailable' };
    }
  }
}

export const weatherProvider = new WeatherProvider();
