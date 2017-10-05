/**
 * Remembers a path of visited items.
 * 
 * @param onMove(lastIdx, curIdx, item) is invoked when the current item is changed
 * @param onRemove(items) is invoked when items are removed from the path
 */
function PathTracker(onMove, onRemove) {
	
	let items = [];	// tracks items
	let idx = -1;	// tracks current index
	let that = this;
	
	/**
	 * Appends a new item to the end of the path.
	 * 
	 * @param item is the item to move
	 * @param moveToItem optionally specifies the auto advancement strategy: false, true (default), "if_next"
	 */
	this.append = function(item, moveToItem) {
		
		items.push(item);
		
		if (moveToItem === false) {
			return;
		} else if (moveToItem === undefined || moveToItem === true) {
			let lastIdx = idx;
			idx = items.length - 1;
			onMove(lastIdx, idx, item);
		} else if (moveToItem === "if_next") {
			if (idx === items.length - 2) {
				this.next();
			}
		} else throw new Error("Unsupported moveToItem parameter: " + moveToItem);
	}

	/**
	 * Moves to the next item.  Sets the next item and clears the rest if the given item is not null.
	 */
	this.next = function(item) {
		
		// set next item
		let deleted;
		if (item) {
			deleted = clearNextsAux();
			items.push(item);
		}
		
		// move to next item
		if (!this.hasNext()) throw new Error("No next item");
		idx++;
		if (deleted) onRemove(deleted);
		onMove(idx - 1, idx, items[idx]);
		return items[idx];
	};
	
	/**
	 * Moves to the previous item.
	 */
	this.prev = function() {
		if (!this.hasPrev()) throw Error("No previous item");
		idx--;
		onMove(idx + 1, idx, items[idx]);
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
			onMove(lastIdx, idx, items[idx]);
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
	
	this.getNexts = function() {
		return items.slice(idx + 1);
	}
	
	this.clearNexts = function() {
		let removed = clearNextsAux();
		onRemove(removed);
	}
	
	this.clear = function() {
		let removed = items;
		items = [];
		idx = -1;
		onRemove(removed);
	}
	
	function clearNextsAux() {
		if (!that.hasNext()) return [];
		let removed = items.slice(idx + 1);
		items = items.slice(0, idx + 1);
		return removed;
	}
}