'use strict';
const pug = require('pug');
const util = require('./handler-util');
const Post = require('./post');

/**
 * HTMLのメソッドで処理を振り分ける
 */
function handle(req, res){
  switch(req.method){
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      Post.findAll({order:[['id', 'DESC']]}).then((posts) => {  //IDを降順にソート
        res.end(pug.renderFile('./views/posts.pug', {
          posts : posts
        }));
      });
      break;
    case 'POST':
      // 投稿内容をログに描き出す
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', () => {
        const decoded = decodeURIComponent(body);
        const content = decoded.split('content=')[1];
        console.info(`投稿されました：${content}`);
        // DBに投稿データを保存する
        Post.create({
          content: content,
          trackingCookie: null,
          postedBy: req.user
        }).then(() => {
          handleRedirectPosts(req, res);
        });
      });
      break;
    default:
      // 未対応のメソッドへのリクエスト処理
      util.handleBadRequest(req, res);
      break;
  }
}
/**
 * リダイレクト処理
 */
function handleRedirectPosts(req, res){
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

module.exports = {
  handle
};
