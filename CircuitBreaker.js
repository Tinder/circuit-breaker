CircuitBreaker.states = {
  open: 1,
  closed: 2
};

function CircuitBreaker(options) {
  options = options || {};

  this.fn = options.fn || null;
  this.failure_rate = options.failure_rate != null ? options.failure_rate : null;
  this.failure_count = options.failure_count != null ? options.failure_count : null;
  this.reset_timeout = options.reset_timeout != null ? options.reset_timeout : null;

  this.reset();
}

CircuitBreaker.prototype.trip = function() {
  this.state = CircuitBreaker.states.open;
  this.start = Date.now();
};

CircuitBreaker.prototype.reset = function() {
  this.passed = 0;
  this.failed = 0;
  this.state = CircuitBreaker.states.closed;
  this.start = Date.now();
};

CircuitBreaker.prototype.pass = function() {
  this.passed++;
  this.update();
};

CircuitBreaker.prototype.fail = function() {
  this.failed++;
  this.update();
};

CircuitBreaker.prototype.open = function() {
  this.update();
  return this.state === CircuitBreaker.states.open;
};

CircuitBreaker.prototype.closed = function() {
  this.update();
  return this.state === CircuitBreaker.states.closed;
};

CircuitBreaker.prototype.monitor = function(cb) {
  var self = this;
  return function(err) {
    if (err) self.fail();
    else self.pass();
    if (cb) cb.apply(this, arguments);
  }
};

CircuitBreaker.prototype.call = function(/* args */) {
  if (arguments.length) {
    var last = arguments[arguments.length - 1];
    var has_callback = (typeof last === 'function');
    if (has_callback) arguments[arguments - 1] = this.monitor(last);
  }
  var is_closed = this.closed();
  if (this.fn && is_closed) return this.fn.apply(null, arguments);
  if (!is_closed) {
    var err = new Error("CircuitBreakerOpen");
    if (has_callback) return last(err);
    return err;
  }
}

CircuitBreaker.prototype.update = function() {
  var should_be_closed = this.detect();
  var is_closed = (this.state === CircuitBreaker.states.closed);
  if (should_be_closed && !is_closed) this.reset();
  if (!should_be_closed && is_closed) this.trip();

  if (this.reset_timeout != null && (Date.now() - this.start) > this.reset_timeout)
    this.reset();
};

CircuitBreaker.prototype.detect = function() {
  var count_exceeded = false;
  var rate_exceeded = false;
  if (this.failure_count != null && this.failed > this.failure_count) count_exceeded = true;
  if (this.failure_rate != null && this.failed && (this.failed / (this.passed + this.failed)) > this.failure_rate) rate_exceeded = true;

  if (this.failure_count != null && this.failure_rate != null) return !count_exceeded || !rate_exceeded;
  if (this.failure_count != null) return !count_exceeded;
  if (this.failure_rate != null) return !rate_exceeded;
  return true;
};

module.exports = CircuitBreaker;
