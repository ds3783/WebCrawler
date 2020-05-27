const http = require('http');
const https = require('https');
const net = require('net');
const EventEmitter = require('events');
const NestiaWeb = require('nestia-web');
const utils = require('../crawler/utils');
const HttpsProxyAgent = require('https-proxy-agent');

const agentConfig = {
  keepAlive: true,
  keepAliveMsecs: 100 * 1e3,
  maxSockets: 32,
  maxFreeSockets: 32
};

let httpsAgentCache = {};

let httpsAgentGcTime = +new Date();

let showLog = false;

/**
 * 构造https 的Agent，如果缓存中存在
 * @param proxyHost  代理服务器IP
 * @param proxyPort  代理服务器端口
 * @returns http.Agent||undefined
 */
let getHttpsAgent = function (proxyHost, proxyPort) {
  "use strict";
  let key = 'http://' + proxyHost + ':' + proxyPort;
  let result, now = +new Date();
  //清理1分钟内未使用的AgentCache
  if (now - httpsAgentGcTime > 60000) {
    httpsAgentGcTime = now;
    for (let k in httpsAgentCache) {
      if (httpsAgentCache.hasOwnProperty(k) && now - httpsAgentCache[k].lastAccessTime > 360000) {
        try {
          httpsAgentCache[k].agent.destroy();
        } catch (e) {
          showLog && NestiaWeb.logger.warn('Error destroy https agent');
          showLog && NestiaWeb.logger.warn(e.message, e);
        }
        delete httpsAgentCache[k];
      }
    }
  }
  if (result = httpsAgentCache[key]) {
    result.lastAccessTime = +new Date();
    return result.agent;
  } else {
    let agent = new HttpsProxyAgent('http://' + proxyHost + ':' + proxyPort);
    result = httpsAgentCache[key] = {
      agent,
      lastAccessTime: +new Date()
    };
    return result.agent;
  }
};

/**
 * Http 代理服务
 */
class MiniProxy extends EventEmitter {


  constructor(port, host) {
    super();

    this._agent = new http.Agent(agentConfig);

    this._port = port;
    this._host = host || '127.0.0.1';
    //构造http server
    this._server = http.createServer();
    this._server.listen(this._port, this._host);
    //处理HTTP代理请求
    this._server.on('request', this._process.bind(this));
    //处理HTTPS代理请求
    this._server.on('connect', this._processHttps.bind(this));

    this._server.on('error', this._onError.bind(this));
    this._server.on('listening', this._onListening.bind(this));


  }

_processHttps(request, clientSocket) {
  /*
  * WARNING:HTTPS CANNOT MODIFY HEADER */
  let headers = Object.assign({}, request.headers);
  let host = headers['x-proxy-server'] || '127.0.0.1';
  let port = headers['x-proxy-port'] || 8888;

  if (!host || !port) {
    showLog && NestiaWeb.logger.warn('Reject proxying HTTPS(proxy server not full filled):[' + request.url + '] to proxy [' + host + ':' + port + ']');
    clientSocket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    clientSocket.end();
    return;
  }

  showLog && NestiaWeb.logger.info('Proxying HTTPS:[' + request.url + '] to proxy [' + host + ':' + port + ']');
  headers = utils.utilizeHeaders(headers);
  //HTTPS 的代理请求使用connect命令，我们无法模拟中间人修改内容，所以直接将请求提交给外部代理服务
  let pSock = net.connect(port, host, function () {
    pSock.write('CONNECT ' + request.url + ' HTTP/' + request.httpVersion + '\r\n');
    for (let hKey in headers) {
      if (headers.hasOwnProperty(hKey)) {
        pSock.write(hKey + ': ' + headers[hKey] + '\r\n');
      }
    }
    pSock.write('\r\n');
    // clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    pSock.pipe(clientSocket);
  }).on('error', function (e) {
    showLog && NestiaWeb.logger.error('Error when proxy https request:' + e.message, e);
    clientSocket.end();
  });

  clientSocket.pipe(pSock);

}

_process(request, response) {
    let extraHeaders = {}, lastIdx;
    //解析请求内容，拿到透传过来待覆盖的header
    if ((lastIdx = request.url.lastIndexOf('@')) >= 0) {
      let subStr = request.url.substr(lastIdx + 1);
      subStr = decodeURIComponent(subStr);
      try {
        let eHeaders = JSON.parse(subStr);
        for (let k in eHeaders) {
          if (eHeaders.hasOwnProperty(k)) {
            extraHeaders[k.toLowerCase()] = eHeaders[k];
          }
        }
        request.url = request.url.substring(0, lastIdx);
      } catch (e) {
        showLog && NestiaWeb.logger.warn('Error parse extra header data:' + url, e);
      }
    }
    // 覆盖原有Header
    let headers = Object.assign(extraHeaders, request.headers);

    //解析使用的代理服务器
    let proxyHost = headers['x-proxy-server'] || '0.0.0.0';
    let proxyPort = headers['x-proxy-port'] || '8888';
    let useHttps = headers['x-proxy-https'] || '0';
    delete headers['x-proxy-server'];
    delete headers['x-proxy-port'];
    delete headers['x-proxy-https'];

    //删除使用代理和puppeteer的痕迹
    if (headers.hasOwnProperty('x-referer')) {
      let referer = headers['x-referer'];
      delete headers['x-referer'];
      if (referer) {
        headers['referer'] = referer;
      }
    }

    if (headers.hasOwnProperty('x-connection')) {
      let connection = headers['x-connection'];
      delete headers['x-connection'];
      if (connection) {
        headers['connection'] = connection;
      }
    }

    if (headers.hasOwnProperty('x-accept-encoding')) {
      let acceptEncoding = headers['x-accept-encoding'];
      delete headers['x-accept-encoding'];
      if (acceptEncoding) {
        headers['accept-encoding'] = acceptEncoding;
      }
    }

    if (headers.hasOwnProperty('x-user-agent')) {
      let userAgent = headers['x-user-agent'];
      delete headers['x-user-agent'];
      if (userAgent) {
        headers['user-agent'] = userAgent;
      }
    }

    if (headers.hasOwnProperty('x-accept-language')) {
      let acceptLanguage = headers['x-accept-language'];
      delete headers['x-accept-language'];
      if (acceptLanguage) {
        headers['accept-language'] = acceptLanguage;
      }
    }
    if (headers.hasOwnProperty('x-origin')) {
      let origin = headers['x-origin'];
      delete headers['x-origin'];
      if (origin) {
        headers['origin'] = origin;
      }
    }

    delete headers['x-devtools-emulate-network-conditions-client-id'];

    // headers['accept-encoding']='gzip, deflate, br';
    let reqOptions = {
      protocol: 'http:',
      host: proxyHost,
      port: proxyPort * 1,
      path: request.url,
      method: request.method,
      family: 4,
      headers: utils.utilizeHeaders(headers),
      agent: this._agent
    };
    showLog && NestiaWeb.logger.info('Proxying ' + (useHttps === '1' ? '[https]' : '') + '[' + request.url + '] to proxy [' + proxyHost + ':' + proxyPort + ']');
    let protocolImpl = http;
    if (useHttps === '1') {
      //ATTENTION: some proxy(such as tiny proxy) didn't impl https message syntax and routing 
      // Reference: https://tools.ietf.org/html/rfc7230
      //https://tools.ietf.org/html/rfc7231#section-4.3.6
      //https://tools.ietf.org/html/draft-luotonen-web-proxy-tunneling-01
      //部分代理服务对https仅支持CONNECT指令，如果代理服务商无法支持，此处不得不换用CONNECT。
      let url = request.url;
      let urlHost = url.match(/^\w+:\/\/([^\/]+)/)[1],
        path = url.replace(new RegExp('^\\w+://' + urlHost.replace(/\./g, '\\.')), ''), urlPort;
      delete reqOptions['port'];
      if (urlHost.indexOf(':') >= 0) {
        urlPort = urlHost.substr(urlHost.indexOf(':') + 1) * 1;
        urlHost = urlHost.substring(0, urlHost.indexOf(':'));
        if (isNaN(urlPort)) {
          showLog && NestiaWeb.logger.error('Error parsing request port, url:' + url);
        } else {
          reqOptions.port = urlPort;
        }
      }
      protocolImpl = https;
      reqOptions['protocol'] = 'https:';
      reqOptions['host'] = urlHost;
      reqOptions['path'] = path;
      // reqOptions['strictSSL'] = false;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

      reqOptions['agent'] = getHttpsAgent(proxyHost, proxyPort);
    }

    let serverRequest;
    showLog && NestiaWeb.logger.info('Proxy request sending ' + (useHttps === '1' ? '[https]' : '') + '[' + request.url + '] to proxy [' + proxyHost + ':' + proxyPort + ']');
    try {
      serverRequest = protocolImpl.request(reqOptions, function (serverResponse) {
        serverResponse.on('error', function (err) {
          response.status(serverResponse.statusCode).end(err.toString());
        });

        response.on('finish', function () {
          showLog && NestiaWeb.logger.info('Proxied ' + (useHttps === '1' ? '[https]' : '') + '[' + request.url + '] to proxy [' + proxyHost + ':' + proxyPort + '] status:' + serverResponse.statusCode);
        });
        try {
          // 返回结果给浏览器前，清除使用代理和CORS相关的header
          delete serverResponse.headers['proxy-connection'];
          delete serverResponse.headers['content-security-policy'];
          delete serverResponse.headers['access-control-expose-headers'];
          delete serverResponse.headers['x-xss-protection'];
          response.writeHead(serverResponse.statusCode, serverResponse.headers);
          serverResponse.pipe(response);
        } catch (e) {
          showLog && NestiaWeb.logger.error('Error write response header or pipe response content:' + e.message, e);
        }
      });
    } catch (e) {
      showLog && NestiaWeb.logger.error('Error sending request:' + (useHttps === '1' ? '[https]' : '') + '[' + request.url + '] to proxy [' + proxyHost + ':' + proxyPort + '],message: ' + e.message, e);
      response.writeHead(500);
      response.end('Internal Error');
      return;
    }
    serverRequest.on('timeout', function () {
      showLog && NestiaWeb.logger.error('Proxy FAILED ' + (useHttps === '1' ? '[https]' : '') + '[' + request.url + '] to proxy [' + proxyHost + ':' + proxyPort + '] TIMEOUT!');
      serverRequest.abort();
      showLog && NestiaWeb.logger.logTimeout();
    });
    serverRequest.on('error', function (err) {
      showLog && NestiaWeb.logger.error('Proxy FAILED ' + (useHttps === '1' ? '[https]' : '') + '[' + request.url + '] to proxy [' + proxyHost + ':' + proxyPort + '] message:' + err.message);
      response.writeHead(500);
      response.end(err.message);
    });
    serverRequest.on('response', function (res) {
      showLog && NestiaWeb.logger.info('Proxy request got response ' + (useHttps === '1' ? '[https]' : '') + '[' + request.url + '] to proxy [' + proxyHost + ':' + proxyPort + '] status:' + res.statusCode);
    });
    request.pipe(serverRequest);
  }

  _onListening() {
    showLog && NestiaWeb.logger.info('[' + this._host + ':' + this._port + '] Proxy started');
  }

  _onError(err) {
    switch (err.code) {
      case 'EACCES':
        showLog && NestiaWeb.logger.error('[' + this._host + ':' + this._port + '] requires elevated privileges');
        break;
      case 'EADDRINUSE':
        showLog && NestiaWeb.logger.error('[' + this._host + ':' + this._port + '] is already in use');
        break;
      default:
        break;
    }
    showLog && NestiaWeb.logger.error('Proxy error:' + err.message, err);
  }
}

module.exports = {
  createProxy: function (port) {
    "use strict";
    showLog = NestiaWeb.manifest.get('proxyLog');
    return new MiniProxy(port);
  }
};