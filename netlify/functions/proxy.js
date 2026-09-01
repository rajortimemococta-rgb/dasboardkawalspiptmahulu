// netlify/functions/proxy.js
const https = require('https');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzsnV0RtLDyo6epqyZOUZ5-TIS6FJwLtGVuELwOS5fZuEqPQ2887UIU70wm6McoEZxHGw/exec';

exports.handler = async (event) => {
  try {
    let params = {};

    // Tangani request POST
    if (event.httpMethod === 'POST') {
      if (event.body) {
        try {
          params = JSON.parse(event.body);
        } catch (e) {
          params = {}; // jika body bukan JSON, gunakan object kosong
        }
      }
    } else {
      // Tangani request GET
      const url = new URL(event.path, `https://${event.headers.host}`);
      params = Object.fromEntries(url.searchParams);
    }

    // Pastikan action selalu ada
    if (!params.action) {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params.action = url.searchParams.get('action') || '';
    }

    // SELALU kirim POST ke Apps Script jika metode asli POST
    if (event.httpMethod === 'POST') {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.text();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: data,
      };
    }

    // Untuk GET, gunakan query string
    const queryString = new URLSearchParams(params).toString();
    const targetUrl = APPS_SCRIPT_URL + (queryString ? `?${queryString}` : '');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.text();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'error', message: error.toString() }),
    };
  }
};
