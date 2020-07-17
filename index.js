'use strict';
const http = require('http');
const auth = require('http-auth');
const router = require('./lib/router');

// Basic認証
const basic = auth.basic({
  realm: 'Enter username and password.',
  file: './users.htpasswd'
});

// サーバの実装
const server = http.createServer(basic, (req, res) => {
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
