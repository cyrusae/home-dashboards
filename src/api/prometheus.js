/**
 * Prometheus API Handler
 * Simple proxy to Prometheus query endpoint
 */

import fetch from 'node-fetch';

/**
 * Query Prometheus
 * @param {string} prometheusUrl - Base Prometheus URL
 * @param {string} query - PromQL query string
 * @returns {Promise<Object>} Prometheus query result
 */
export async function queryPrometheus(prometheusUrl, query) {
  if (!prometheusUrl) {
    throw new Error('Prometheus URL not configured');
  }

  if (!query) {
    throw new Error('Missing query parameter');
  }

  const url = `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Prometheus error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}