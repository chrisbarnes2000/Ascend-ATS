/**
 * @fileoverview Central configuration constants for Ascend ATS Browser Extension popup.
 * Adheres to NASA JPL Rule 8: No magic values; central configuration.
 */

/**
 * Base URL for the Ascend ATS web application and backend API proxy.
 * @type {string}
 */
export const APP_BASE_URL = 'https://ascend-ats.ai.studio';

/**
 * Metadata dictionary describing the 3-tier prompt matrix models, latencies, and output scopes.
 * @type {Record<string, { latency: string, tag: string, desc: string }>}
 */
export const PROMPT_INFO = {
  v1: {
    latency: '~300ms',
    tag: 'Heuristic',
    desc: '<strong>V1 Fast:</strong> High-speed deterministic extraction of compensation, clean markdown, and explicit qualifications.'
  },
  v2: {
    latency: '~1.2s',
    tag: 'Taxonomy',
    desc: '<strong>V2 Semantic:</strong> Standardizes skill taxonomy into technical & soft domains with 10-point perks mapping.'
  },
  v3: {
    latency: '~2.5s',
    tag: 'STAR Prep',
    desc: '<strong>V3 Executive:</strong> Generates STAR behavioral interview prep, unstated expectations, and customized pitch advice.'
  }
};
