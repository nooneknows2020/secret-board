'use strict';
const http = require('http');
const router = require('./lib/router');

// サーバの実装
const server = http.createServer((req, res) => {
  // routerモジュールのroute関数を呼び出す
  router.route(req, res);
}).on('error', (e) => {
  console.error('Server Error', e)
}).on('clientError', (e) => {
  console.error('Client Error', e)
});

// サーバを起動
const port = 8000;
server.listen(port, () => {
  console.info(`Listening on ${port}`);
});
