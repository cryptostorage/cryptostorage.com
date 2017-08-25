/**
 * Remembers a path of visited items.
 * 
 * @param onUpdate(lastIdx, curIdx, item) is invoked when the state is changed
 */
function PathTracker(onUpdate) {
	
	var items = [];	// tracks items
	var idx = -1;	// tracks current index
	var that = this;

	/**
	 * Moves to the next item.  Sets the next item to the given item if not null.
	 */
	this.next = function(item) {
		
		// set next item
		if (item) {
			clearNexts();
			items.push(item);
		}
		
		// move to next item
		if (!that.hasNext()) throw Error("No next item");
		idx++;
		onUpdate(idx - 1, idx, items[idx]);
		return items[idx];
	};
	
	/**
	 * Moves to the previous item.
	 */
	this.prev = function() {
		if (!that.hasPrev()) throw Error("No previous item");
		idx--;
		onUpdate(idx + 1, idx, items[idx]);
		return items[idx];
	}
	
	/**
	 * Moves to the given item if not null.  Returns the current item.
	 */
	this.current = function(item) {
		
		// set current item
		if (item) {
			var lastIdx = idx;
			found = false;
			for (let i = 0; i < items.length; i++) {
				if (items[i] === item) {
					found = true;
					idx = i;
					break;
				}
			}
			if (!found) throw Error("Item does not exist: " + item);
			onUpdate(lastIdx, idx, items[idx]);
		}
		
		// return current item
		if (idx === -1) return null;
		return items[idx];
	}
	
	this.hasNext = function() {
		return idx < items.length - 1;
	}
	
	this.hasPrev = function() {
		return idx > 0;
	}
	
	this.getItems = function() {
		return items;
	}
	
	this.getIndex = function() {
		return idx;
	}
	
	function clearNexts() {
		items = items.slice(0, idx + 1);
	}
}