// netlify/functions/proxy.js
const https = require('https');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzsnV0RtLDyo6epqyZOUZ5-TIS6FJwLtGVuELwOS5fZuEqPQ2887UIU70wm6McoEZxHGw/exec';

exports.handler = async (event) => {
  try {
    let params = {};

    // Jika request dari client adalah POST, ambil body JSON
    if (event.httpMethod === 'POST') {
      if (event.body) {
        params = JSON.parse(event.body);
      }
    } else {
      // Jika GET, ambil parameter dari query string
      const url = new URL(event.path, `https://${event.headers.host}`);
      params = Object.fromEntries(url.searchParams);
    }

    // Pastikan action selalu ada
    if (!params.action) {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params.action = url.searchParams.get('action');
    }

    const action = params.action || '';

    // Jika request asli adalah POST, selalu kirim POST ke Apps Script
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

    // Untuk GET, gunakan query string ke Apps Script
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
