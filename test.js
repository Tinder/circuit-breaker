var should = require('should');
var sinon = require('sinon');
require('should-sinon');
var CircuitBreaker = require('./CircuitBreaker');

describe('CircuitBreaker', function() {
  it('should default fn to null', function() {
    var cb = new CircuitBreaker();
    should.not.exist(cb.fn);
  });

  it('should default failure_rate to null', function() {
    var cb = new CircuitBreaker();
    should.not.exist(cb.failure_rate);
  });

  it('should default failure_count to null', function() {
    var cb = new CircuitBreaker();
    should.not.exist(cb.failure_count);
  });

  it('should default reset_timeout to null', function() {
    var cb = new CircuitBreaker();
    should.not.exist(cb.reset_timeout);
  });

  it('should set passed to 0', function() {
    var cb = new CircuitBreaker();
    cb.passed.should.equal(0);
  });

  it('should set failed to 0', function() {
    var cb = new CircuitBreaker();
    cb.failed.should.equal(0);
  });

  it('should set state to closed', function() {
    var cb = new CircuitBreaker();
    cb.state.should.equal(CircuitBreaker.states.closed);
  });

  it('should set start to now', function() {
    var cb = new CircuitBreaker();
    cb.start.should.approximately(Date.now(), 1);
  });

  it('should set fn to provided function', function() {
    var fn = function(){};
    var cb = new CircuitBreaker({ fn: fn });
    cb.fn.should.equal(fn);
  });

  it('should set failure_rate to provided number', function() {
    var cb = new CircuitBreaker({ failure_rate: 0.5 });
    cb.failure_rate.should.equal(0.5);
  });

  it('should set failure_count to provided number', function() {
    var cb = new CircuitBreaker({ failure_count: 50 });
    cb.failure_count.should.equal(50);
  });

  it('should set reset_timeout to provided number', function() {
    var cb = new CircuitBreaker({ reset_timeout: 1000 });
    cb.reset_timeout.should.equal(1000);
  });
});

describe('CircuitBreaker#states', function() {
  it('should have an open state', function() {
    should.exist(CircuitBreaker.states.open);
  });

  it('should have an closed state', function() {
    should.exist(CircuitBreaker.states.closed);
  });

  it('open state should not equal closed state', function() {
    CircuitBreaker.states.open.should.not.equal(CircuitBreaker.states.closed);
  });
});

describe('CircuitBreaker#trip', function() {
  it('should set state to open', function() {
    var cb = new CircuitBreaker();
    cb.state = CircuitBreaker.states.closed;
    cb.trip();
    cb.state.should.equal(CircuitBreaker.states.open);
  });

  it('should set start to now', function() {
    var cb = new CircuitBreaker();
    cb.start = new Date(0);
    cb.trip();
    cb.start.should.approximately(Date.now(), 1);
  });
});

describe('CircuitBreaker#reset', function() {
  it('should set state to closed', function() {
    var cb = new CircuitBreaker();
    cb.state = CircuitBreaker.states.open;
    cb.reset();
    cb.state.should.equal(CircuitBreaker.states.closed);
  });

  it('should set start to now', function() {
    var cb = new CircuitBreaker();
    cb.start = new Date(0);
    cb.reset();
    cb.start.should.approximately(Date.now(), 1);
  });

  it('should set passed to 0', function() {
    var cb = new CircuitBreaker();
    cb.passed = 10;
    cb.reset();
    cb.passed.should.equal(0);
  });

  it('should set failed to 0', function() {
    var cb = new CircuitBreaker();
    cb.failed = 10;
    cb.reset();
    cb.failed.should.equal(0);
  });
});

describe('CircuitBreaker#fail', function() {
  it('should increment failed', function() {
    var cb = new CircuitBreaker();
    var before = cb.failed;
    cb.fail();
    cb.failed.should.equal(before + 1);
    before = cb.failed;
    cb.fail();
    cb.failed.should.equal(before + 1);
  });

  it('should trip the breaker when failure_count is exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 2 });
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
  });

  it('should trip the breaker when failure_rate is exceeded', function() {
    var cb = new CircuitBreaker({ failure_rate: 0.5 });
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.pass();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
  });

  it ('should trip the breaker when failure_rate and failure_count are exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 2, failure_rate: 0.5 });
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.pass();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
  });
});

describe('CircuitBreaker#pass', function() {
  it('should increment passed', function() {
    var cb = new CircuitBreaker();
    var before = cb.passed;
    cb.pass();
    cb.passed.should.equal(before + 1);
    before = cb.passed;
    cb.pass();
    cb.passed.should.equal(before + 1);
  });

  it('should reset the breaker when failure_rate is not exceeded', function() {
    var cb = new CircuitBreaker({ failure_rate: 0.5 });
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.pass();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
    cb.pass();
    cb.state.should.equal(CircuitBreaker.states.closed);
  });

  it ('should reset the breaker when failure_rate is not exceeded and failure_count is exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 2, failure_rate: 0.5 });
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.pass();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.closed);
    cb.fail();
    cb.state.should.equal(CircuitBreaker.states.open);
    cb.pass();
    cb.state.should.equal(CircuitBreaker.states.open);
    cb.pass();
    cb.state.should.equal(CircuitBreaker.states.closed);
  });
});

describe('CircuitBreaker#open', function() {
  it('should be false by default', function() {
    var cb = new CircuitBreaker();
    cb.open().should.be.false();
  });

  it('should be true when failure_count is exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 0 });
    cb.fail();
    cb.open().should.be.true();
  });

  it('should be true when failure_rate is exceeded', function() {
    var cb = new CircuitBreaker({ failure_rate: 0.5 });
    cb.fail();
    cb.open().should.be.true();
  });

  it('should be false when failure_rate is exceeded but failure_count is not exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 1, failure_rate: 0.5 });
    cb.fail();
    cb.open().should.be.false();
  });

  it('should be true when failure_rate and failure_count are exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 1, failure_rate: 0.5 });
    cb.fail();
    cb.fail();
    cb.open().should.be.true();
  });

  it('should be false when failure_rate is not exceeded and failure_count is exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 1, failure_rate: 0.5 });
    cb.fail();
    cb.fail();
    cb.pass();
    cb.pass();
    cb.open().should.be.false();
  });

  it('should be false when reset_timeout has expired', function(done) {
    var cb = new CircuitBreaker({ failure_count: 0, reset_timeout: 1 });
    cb.fail();
    setTimeout(function() {
      cb.open().should.be.false();
      done();
    }, 2);
  });
});

describe('CircuitBreaker#closed', function() {
  it('should be true by default', function() {
    var cb = new CircuitBreaker();
    cb.closed().should.be.true();
  });

  it('should be false when failure_count is exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 0 });
    cb.fail();
    cb.closed().should.be.false();
  });

  it('should be false when failure_rate is exceeded', function() {
    var cb = new CircuitBreaker({ failure_rate: 0.5 });
    cb.fail();
    cb.closed().should.be.false();
  });

  it('should be true when failure_rate is exceeded but failure_count is not exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 1, failure_rate: 0.5 });
    cb.fail();
    cb.closed().should.be.true();
  });

  it('should be false when failure_rate and failure_count are exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 1, failure_rate: 0.5 });
    cb.fail();
    cb.fail();
    cb.closed().should.be.false();
  });

  it('should be true when failure_rate is not exceeded and failure_count is exceeded', function() {
    var cb = new CircuitBreaker({ failure_count: 1, failure_rate: 0.5 });
    cb.fail();
    cb.fail();
    cb.pass();
    cb.pass();
    cb.closed().should.be.true();
  });

  it('should be true when reset_timeout has expired', function(done) {
    var cb = new CircuitBreaker({ failure_count: 0, reset_timeout: 1 });
    cb.fail();
    setTimeout(function() {
      cb.closed().should.be.true();
      done();
    }, 3);
  });
});

describe('CircuitBreaker#monitor', function() {
  it('should return a function', function() {
    var cb = new CircuitBreaker();
    cb.monitor().should.be.a.Function();
  });

  it('should call pass when not called with an error', function() {
    var cb = new CircuitBreaker();
    cb.pass = sinon.spy();
    cb.monitor()();
    cb.pass.should.be.called();
  });

  it('should call fail when called with an error', function() {
    var cb = new CircuitBreaker();
    cb.fail = sinon.spy();
    cb.monitor()('error');
    cb.fail.should.be.called();
  });

  it('should call the given callback', function() {
    var cb = new CircuitBreaker();
    var callback = sinon.spy();
    cb.monitor(callback)();
    callback.should.be.called();
  });

  it('should call the callback with same arguments', function() {
    var cb = new CircuitBreaker();
    var callback = sinon.spy();
    cb.monitor(callback)(1, {}, 'str');
    callback.should.be.calledWithExactly(1, {}, 'str');
  });
});

describe('CircuitBreaker#call', function() {
  it('should call the injected fn when closed', function() {
    var cb = new CircuitBreaker({ fn: sinon.spy() });
    cb.call();
    cb.fn.should.be.called();
  });

  it('should not call the injected fn when open', function() {
    var cb = new CircuitBreaker({ failure_count: 0, fn: sinon.spy() });
    cb.fail();
    cb.call();
    cb.fn.should.not.be.called();
  });

  it('should wrap callback with monitor', function() {
    var cb = new CircuitBreaker();
    var callback = function() {};
    cb.monitor = sinon.spy();
    cb.call('arg', callback);
    cb.monitor.should.be.calledWithExactly(callback);
  });

  it('should return the value returned by injected fn', function() {
    var cb = new CircuitBreaker({ fn: sinon.stub().returns(42) });
    cb.call().should.equal(42);
  });

  it('should call callback with error when open', function() {
    var cb = new CircuitBreaker({ failure_count: 0, fn: sinon.stub() });
    cb.fail();
    var callback = sinon.spy();
    cb.call(callback);
    callback.should.be.calledWithExactly(new Error('CircuitBreakerOpen'));
  });

  it('should return error when open and no callback', function() {
    var cb = new CircuitBreaker({ failure_count: 0, fn: sinon.stub() });
    cb.fail();
    cb.call().should.be.eql(new Error('CircuitBreakerOpen'));
  });
});

describe('CircuitBreaker#on', function() {
  it('should emit "open" when tripped', function() {
    var cb = new CircuitBreaker();
    var listener = sinon.spy();
    cb.on('open', listener);
    cb.trip();
    listener.should.be.called();
  });

  it('should emit "close" when reset', function() {
    var cb = new CircuitBreaker();
    var listener = sinon.spy();
    cb.on('close', listener);
    cb.reset();
    listener.should.be.called();
  });
});
