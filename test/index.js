/* global before:false */
/* global it:false */

var assert = require('assert')
var async = require('async')
var prefixedRedis = require('../')

var PREFIX = 'pref:'
var client = prefixedRedis.createClient(PREFIX)

before(function (done) {
  client.flushdb(done)
})

it('Should use prefixes', function (done) {
  var rawClient = require('redis').createClient()
  client.set('var', 'data', function (err) {
    assert.ifError(err)

    rawClient.get(PREFIX + 'var', function (err, result) {
      assert.ifError(err)
      assert.equal(result, 'data')
      done()
    })
  })
})

it('Should set and get', function (done) {
  client.set('key', 'val', function (err) {
    assert.ifError(err)

    client.get('key', function (err, result) {
      assert.ifError(err)
      assert.equal(result, 'val')
      done()
    })
  })
})

it('Should set and get multi', function (done) {
  client.multi()
    .set('key1', 'val1')
    .set('key2', 'val2')
    .exec(function (err) {
      assert.ifError(err)

      async.map(['key1', 'key2'], function (k, cb) {
        client.get(k, cb)
      }, function (err, results) {
        assert.ifError(err)
        assert.deepEqual(results, ['val1', 'val2'])
        done()
      })
    })
})
