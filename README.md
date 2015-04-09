## Usage

```js
var redisNamespace = require('redis-namespace')
var client = redisNamespace.createClient('myPrefix:')
client.set('foo', 'bar', function (err) {
  // 'myPrefix:foo' is set to 'bar' in Redis
})
```

## Why?

There are multiple Node libraries meant to do the same thing but none with with Node Redis' `MULTI` implementation.
