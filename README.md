#CircuitBreaker

A utility for logically branching based on failure rates and/or counts

###Usage

**Raw**
```javascript
var breaker = new CircuitBreaker({
  failure_rate: 0.5,
  failure_count: 10,
  reset_timeout: 30*1000
});

if (breaker.closed()) {
  doSomething("arg", function(err) {
    if (err) {
      breaker.fail();
      return;
    }

    breaker.pass();
    ... continue ...
  });
}
```

**Wrapped Callback**
```javascript
var breaker = new CircuitBreaker({
  failure_rate: 0.5,
  failure_count: 10,
  reset_timeout: 30*1000
});

if (breaker.closed()) {
  doSomething("arg", breaker.monitor(function(err) {
    ... continue ...
  }));
}
```

**Injected**
```javascript
var breaker = new CircuitBreaker({
  failure_rate: 0.5,
  failure_count: 10,
  reset_timeout: 30*1000,
  fn: doSomething
});

breaker.call("arg", function(err) {
  ... continue ...
});
```

###API

**CircuitBreaker(options)**
Constructor

**pass()**
Counts a success event.

**fail()**
Counts a failure event.

**open()**
Returns true if the circuit breaker is open and false otherwise.

**closed()**
Return true if the circuit breaker is closed and false otherwise.

**monitor([cb])**
Wraps a callback. Calls fail if callback is called with an err and pass otherwise.

**call([arg1[, arg2[, ...]]])**
Calls injected fn with provided arguments if the breaker is closed. If last argument is a function, it is assumed to be a callback and is wrapped by monitor.  

###Options

**failure_rate**
Rate of failure required to trip the circuit breaker.

**failure_count**
Failure count required to trip the circuit breaker.

**reset_timeout**
Time in milliseconds to wait before reseting the circuit breaker once it has been tripped.

**[fn]**
Function to be gated by the circuit breaker.
