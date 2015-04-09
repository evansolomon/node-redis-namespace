var util = require('util')
var redis = require('redis')

var redisCommandsSpec = require('./redis-commands.json')

/**
 * Create a Redis client instance that namespaces keys.
 */
exports.createClient = function (prefix /*, redisConfigArgs... */) {
  var redisConfigArgs = Array.prototype.slice.call(arguments, 1)
  var client = redis.createClient.apply(redis, redisConfigArgs)
  bindClient(prefix, client)
  return client
}


/**
 * Subclass redis.Multi to namespace queued commands.
 */
function PrefixedMulti(prefix, client, args) {
  redis.Multi.call(this, client, args)
  bindClient(prefix, this)
}
util.inherits(PrefixedMulti, redis.Multi)


/**
 * Bind a given client to a namespace.
 */
function bindClient(prefix, client) {
  var originalFunction
  for (var prop in client) {
    var spec = redisCommandsSpec[prop.toUpperCase()]
    if (! spec) continue

    originalFunction = client[prop]
    client[prop] = bindCommand(client, prop, spec, prefix)
  }

  // Special case because it needs a separate class
  client.multi = client.MULTI = function (args) {
    return new PrefixedMulti(prefix, client, args)
  }
}

/**
 * Bind a single command in a client.
 */
function bindCommand(client, command, spec, prefix) {
  var originalFunction = client[command]
  return function () {
      var args = Array.prototype.slice.call(arguments, 0)
      var prefixedArgs = prefixKeyArgs(spec, prefix, args)
      return originalFunction.apply(client, prefixedArgs)
    }
}

/**
 * Prefix arguments that are defined as keys in the Redis spec.
 */
function prefixKeyArgs(spec, prefix, args) {
  var argSpec = spec.arguments
  if (! argSpec) return args

  return args.map(function (arg, i) {
    var argIsString = typeof arg === 'string'
    var commandExists = !! argSpec[i]
    var argIsKey = commandExists && argSpec[i].type === 'key'

    var shouldPrefix = argIsString && argIsKey

    if (shouldPrefix) {
      arg = prefix + arg
    }

    return arg
  })
}
