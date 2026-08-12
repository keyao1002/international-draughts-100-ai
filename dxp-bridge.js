#!/usr/bin/env node
// Scan bridge v4 — 同步请求/响应模式
//   POST /connect  握手: hub → wait → init → ready (bridge 内部完成, 浏览器只等结果)
//   POST /go       {pos, level, timeout} → 发命令 → 等 Scan 的 done → 一次返回 {move, line, info}
//   GET  /status   连接状态
// 无浏览器轮询, 无共享队列竞争, 每步棋都是独立请求-响应。

const http = require('http');
const fs   = require('fs');
const url  = require('url');
const { spawn } = require('child_process');

const PORT = parseInt(process.argv[2] || '28754');
const HTML_PATH = '/home/le/桌面/international-checkers.html';

const scan = spawn('/home/le/bin/scan-engine', ['hub'], {
  cwd: '/home/le/.scan', stdio: ['pipe','pipe','pipe']
});
process.stdout.write('[bridge] Scan pid: ' + scan.pid + '\n');
scan.stderr.on('data', (d) => process.stderr.write('[scan!] ' + d));

let connected = false;      // 握手完成
let connectStage = 0;       // 0=idle, 1=hub已发, 2=init已发
let connectWaiters = [];    // 等待握手的 {resolve, timer}
let currentGo = null;       // 当前搜索 {resolve, timer, timeoutMs}
let infoLines = [];         // 最近一次搜索的 info 行

let lineBuf = '';
scan.stdout.on('data', (chunk) => {
  lineBuf += chunk.toString();
  let nl;
  while((nl = lineBuf.indexOf('\n')) >= 0){
    const line = lineBuf.slice(0, nl).trim();
    lineBuf = lineBuf.slice(nl + 1);
    if(line) handleLine(line);
  }
});

function handleLine(line){
  if(line === 'wait' && connectStage === 1){
    connectStage = 2;
    scan.stdin.write('init\n');
    process.stdout.write('[bridge→scan] init (on wait)\n');
  } else if(line === 'ready'){
    connected = true;
    connectStage = 0;
    while(connectWaiters.length){
      const w = connectWaiters.shift();
      clearTimeout(w.timer);
      w.resolve(true);
    }
  } else if(line.startsWith('done ')){
    if(currentGo){
      const g = currentGo;
      currentGo = null;
      clearTimeout(g.timer);
      const move = (line.match(/move=([^\s]+)/) || [])[1] || '';
      g.resolve({line, move, info: infoLines.splice(0)});
    }
  } else if(line.startsWith('info ')){
    infoLines.push(line);
    if(infoLines.length > 500) infoLines.shift();
  }
  // id / param / init / error / 其他行忽略
}

function failConnectWaiter(msg){
  while(connectWaiters.length){
    const w = connectWaiters.shift();
    clearTimeout(w.timer);
    w.resolve(false);
  }
  if(currentGo){
    const g = currentGo;
    currentGo = null;
    clearTimeout(g.timer);
    g.resolve({line:'', move:'', info: infoLines.splice(0), error: msg});
  }
  connected = false;
}

scan.on('exit', (code) => {
  process.stdout.write('[bridge] Scan exited: ' + code + '\n');
  failConnectWaiter('scan exited: ' + code);
});

const CORS = {'Access-Control-Allow-Origin':'*'};
const json = (res, obj) => {
  try {
    res.writeHead(200, {...CORS, 'Content-Type':'application/json'});
    res.end(JSON.stringify(obj));
  } catch(e){}
};

const server = http.createServer((req, res) => {
  const u = url.parse(req.url, true);

  if(req.method === 'OPTIONS'){
    res.writeHead(204, {...CORS,
      'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'});
    res.end();
    return;
  }

  // GET / -> HTML
  if(req.method === 'GET' && (u.pathname === '/' || u.pathname === '/international-checkers.html')){
    fs.readFile(HTML_PATH, (err, data) => {
      if(err){ res.writeHead(500); res.end('Bridge: HTML not found'); return; }
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-cache, no-store, must-revalidate', ...CORS});
      res.end(data);
    });
    return;
  }

  // GET /status
  if(req.method === 'GET' && u.pathname === '/status'){
    json(res, {connected, scan_pid: scan.pid, busy: !!currentGo, queue: 0});
    return;
  }

  // POST /connect — 握手
  if(req.method === 'POST' && u.pathname === '/connect'){
    if(connected){
      json(res, {ok: true, connected: true});
      return;
    }
    if(connectStage !== 0){
      json(res, {ok: false, error: 'connect in progress'});
      return;
    }
    connectStage = 1;
    scan.stdin.write('hub\n');
    process.stdout.write('[bridge→scan] hub\n');
    const timer = setTimeout(() => {
      const idx = connectWaiters.findIndex(w => w.timer === timer);
      if(idx >= 0) connectWaiters.splice(idx, 1);
      connectStage = 0;
      json(res, {ok: false, error: 'connect timeout (20s)'});
    }, 20000);
    connectWaiters.push({
      resolve: (ok) => {
        clearTimeout(timer);
        json(res, ok ? {ok: true, connected: true} : {ok: false, error: 'scan not ready'});
      },
      timer
    });
    return;
  }

  // POST /go — 同步搜索
  if(req.method === 'POST' && u.pathname === '/go'){
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let p;
      try { p = JSON.parse(body); } catch(e){ json(res, {ok:false, error:'bad JSON'}); return; }
      if(!connected){ json(res, {ok:false, error:'not connected'}); return; }
      if(currentGo){ json(res, {ok:false, error:'busy'}); return; }
      const timeoutSec = Math.max(1, p.timeout || 30);
      const level = p.level || 'move-time=2';
      scan.stdin.write('set-param name=book value=false\n');
      scan.stdin.write('pos pos=' + p.pos + '\n');
      scan.stdin.write('level ' + level + '\n');
      scan.stdin.write('go think\n');
      process.stdout.write('[bridge→scan] set-param/book=false | pos=' + p.pos + ' | level=' + level + ' | go\n');
      const timer = setTimeout(() => {
        if(currentGo){
          const g = currentGo;
          currentGo = null;
          json(res, {ok:false, error:'timeout (' + timeoutSec + 's)', info: infoLines.splice(0)});
        }
      }, timeoutSec * 1000);
      currentGo = {
        resolve: (result) => {
          clearTimeout(timer);
          json(res, {ok:true, ...result});
        },
        timer
      };
    });
    return;
  }

  res.writeHead(404, {...CORS});
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write('[bridge] v4 sync mode on http://127.0.0.1:' + PORT + '\n');
  process.stdout.write('[bridge]   POST /connect | POST /go | GET /status | GET / -> HTML\n');
});

process.on('SIGTERM', () => { server.close(); scan.kill(); process.exit(0); });
process.on('SIGINT',  () => { server.close(); scan.kill(); process.exit(0); });
