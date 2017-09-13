/**
 * Tracks the number of started and stopped threads.
 * 
 * Allows a function to be notified when there are no active threads.
 */
function ThreadTracker() {
	
	var numStarted = 0;
	var numStopped = 0;
	var idleCallback;
	var thiz = this;

	this.threadStarted = function() {
		numStarted++;
		if (numStarted <= numStopped) throw "Number of started threads must be greater than number of ended threads";
		onChange();
	};
	
	this.threadStopped = function() {
		numStopped++;
		if (numStarted < numStopped) throw "Number of started threads must be greater than or equal to number of ended threads";
		onChange();
	};
	
	this.getNumStarted = function() {
		return numStarted;
	};
	
	this.getNumStopped = function() {
		return numStopped;
	};
	
	this.getNumActive = function() {
		return numStarted - numStopped;
	};
	
	this.onIdle = function(callback) {
		idleCallback = callback;
	};
	
	function onChange() {
		if (thiz.getNumActive() === 0) idleCallback();
	}
}