'use strict';
const pug = require('pug');
const Cookies = require('cookies');
const moment = require('moment-timezone');
const util = require('./handler-util');
const Post = require('./post');

const trackingIdKey = 'tracking_id';

/**
 * HTMLのメソッドで処理を振り分ける
 */
function handle(req, res){
  const cookies = new Cookies(req, res);
  addTrackingCookie(cookies);

  switch(req.method){
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      Post.findAll({order:[['id', 'DESC']]}).then((posts) => {  //IDを降順にソート
        posts.forEach((post) => {
          post.content = post.content.replace(/\+/g, ' ');
          post.formattedCreatedAt = moment(post.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');  //日時のフォーマット
        });
        res.end(pug.renderFile('./views/posts.pug', {
          posts : posts,
          user: req.user
        }));
        // 閲覧情報をサーバのログに残す
        console.info(`閲覧されました:${req.user}, trackingId:${cookies.get(trackingIdKey)}, remoteAddress:${req.connection.remoteAddress}, userAgent:${req.headers['user-agent']}`);
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
          trackingCookie: cookies.get(trackingIdKey),
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
/*
 * 削除処理
 */
function handleDelete(req, res){
  switch (req.method){
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', () => {
        const decoded = decodeURIComponent(body);
        const id = decoded.split('id=')[1];
        Post.findByPk(id).then((post) => {
          console.info(`削除されました:user:${req.user}, remoteAddress:${req.connection.remoteAddress}, userAgent:${req.headers['user-agent']}`);
          if(req.user === post.postedBy || req.user === 'admin'){
            post.destroy().then(() => {
              handleRedirectPosts(req, res);
            });
          }
        });
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}
/**
 * Cookieを付与して、その日の間だけは同じ人の投稿であることがわかるように実装する
 */
function addTrackingCookie(cookies){
  // トラッキングCookieがあるときは、何もしない
  if(cookies.get(trackingIdKey)) return;

  const trackingId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));
  cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
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
  handle,
  handleDelete
};
