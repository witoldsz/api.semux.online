const express = require('express')
const httpProxy = require('http-proxy')
const R = require('ramda')
const request = require('request')
const url = require('url')

const app = express()

const proxy = httpProxy.createProxy({
  target: env('SEMUX_API_ADDR'),
  auth: `${env('SEMUX_API_USER')}:${env('SEMUX_API_PASS')}`,
  proxyTimeout: 15000,
})

const proxyMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    corsHeader(res).end()
  } else {
    proxy.web(req, corsHeader(res), undefined, next)
  }
}

const apiProxy = { }
apiProxy['/v2.1.0'] = {
  '/info': ['get'],
  '/account': ['get'],
  '/account/transactions': ['get'],
  '/account/pending-transactions': ['get'],
  '/account/votes': ['get'],
  '/block-by-hash': ['get'],
  '/block-by-number': ['get'],
  '/delegates': ['get'],
  '/latest-block': ['get'],
  '/latest-block-number': ['get'],
  '/pending-transactions': ['get'],
  '/transaction': ['get'],
  '/transaction-limits': ['get'],
  '/validators': ['get'],
  '/vote': ['get'],
  '/votes': ['get'],
  '/transaction/raw': ['post'],
  '/compose-raw-transaction': ['get'],
  '/syncing': ['get'],
}
apiProxy['/v2.2.0'] = {
  ...apiProxy['/v2.1.0'],
  '/transaction-result': ['get'],
}
apiProxy['/v2.3.0'] = {
  ...apiProxy['/v2.2.0'],
}

app.get('/', proxyMiddleware)
app.get('/favicon*', proxyMiddleware)
app.get('/swagger-ui/*', proxyMiddleware)

Object.entries(apiProxy).forEach(([version, paths]) => {
  app.get(version, proxyMiddleware)
  app.get(`/swagger${version}.json`, modifySwaggerJsonMiddleware(version))
  Object.entries(paths).forEach(([path, methods]) => {
    const withOptions = m => m.includes('post') ? [...m, 'options'] : m
    withOptions(methods).forEach((method) => {
      app[method](version + path, proxyMiddleware)
    })
  })
})

console.log('Starting server…')
const server = app.listen(
  env('API_SEMUX_ONLINE_PORT'),
  env('API_SEMUX_ONLINE_HOST'),
  () => {
    const address = server.address()
    console.log(`Server listening: http://${address.address}:${address.port}`, address)
  },
)

// ----------------------------------------------------

function modifySwaggerJsonMiddleware(version) {
  return (req, res, next) => {
    const auth = { user: env('SEMUX_API_USER'), pass: env('SEMUX_API_PASS') }
    const callback = (err, _, orig) => {
      if (err) next(err)
      else res.json(modifySwaggerJson(version, orig))
    }
    request.get(url.resolve(env('SEMUX_API_ADDR'), req.originalUrl), { auth, json: true }, callback)
  }
}

function modifySwaggerJson(version, orig) {
  const paths = R.pipe(
    R.mapObjIndexed((method, path) => {
      const methods = R.path([version, path], apiProxy)
      return methods && R.pick(methods, method)
    }),
    R.filter(R.identity),
    R.map(R.map(R.dissoc('security'))),
  )(orig.paths)

  const extraDescription = '**Semux Online API** project: https://github.com/witoldsz/api.semux.online'
  return R.pipe(
    R.assocPath(['info', 'title'], 'Semux Online API'),
    R.over(R.lensPath(['info', 'description']), d => `${d}\n\n${extraDescription}`),
    R.assoc('paths', paths),
    R.dissoc('security'),
    R.dissoc('securityDefinitions'),
    R.dissoc('schemes'),
  )(orig)
}

function corsHeader(res) {
  return res.header('Access-Control-Allow-Origin', '*')
}

function env(e) {
  const value = process.env[e]
  if (!value) {
    throw new Error(`environment ${e}='${value}' must be set`)
  }
  return value
}
