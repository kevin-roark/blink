
function search(frame, width, height) {
  var MAX_BLOBS_TO_FIND = 30;
  var BLOB_SEARCH_BORDER = 20;
  var MIN_BLOBS_FOUND = 2;
  var MAX_BLOBS_FOUND = 25;
  var MIN_HOR_EYE_SEP = 15;
  var MAX_HOR_EYE_SEP = 80;
  var MAX_VERT_Y_SEP = 55;

  function pixel(x, y) {
  	if (x < 0 || x >= width || y < 0 || y >= height) {
  	  return 255;
  	}
    return frame[x + y * width];
  }

  // Heuristic to trace the perimeter of a blob of pixels
  function tracePerim(i, j) {
	  var x = i;
	  var y = j + 1;
	  var xmin = i;
	  var xmax = i;
	  var ymin = j;
	  var ymax = j;
    var dir = 1;

    for (var count = 0; count < 300; count++) {
	    var found = false;
  	  if ((x == i) && (y == j)) break; // gone full circle

        //   /3\
        // 2<   >4
        //   \1/

  	  if (!found && dir == 1) {  // Downwards
  	    if (!found && pixel(x-1, y) == 0) {
  		  x--;
  		  found = true;
  		  dir = 2;
  		  }
    		if (!found && pixel(x, y+1) == 0) {
    		  y++;
    		  found = true;
    		  dir = 1;
    		}
    		if (!found && pixel(x+1, y) == 0) {
    		  x++;
    		  found = true;
    		  dir = 4;
    		}
        if (!found && pixel(x, y-1) == 0) {
  		    y--;
  		    found = true;
  		    dir = 3;
  		  }
      }

	    if (!found && dir == 4) { // Rightwards
  	    if (!found && pixel(x, y+1) == 0) {
  		    y++;
  		    found = true;
  		    dir = 1;
  		  }
  		  if (!found && pixel(x+1, y) == 0) {
  		    x++;
  		    found = true;
  		    dir = 4;
  		  }
  		  if (!found && pixel(x, y-1) == 0) {
    		  y--;
    		  found = true;
    		  dir = 3;
    		}
        if (!found && pixel(x-1, y) == 0) {
    		  x--;
    		  found = true;
    		  dir = 2;
    		  }
        }

	      if (!found && dir == 3) { // Upwards
    	    if (!found && pixel(x+1, y) == 0) {
    		  x++;
    		  found = true;
    		  dir = 4;
    		}
    		if (!found && pixel(x, y-1) == 0) {
    		  y--;
    		  found = true;
    		  dir = 3;
    		}
    		if (!found && pixel(x-1, y) == 0) {
    		  x--;
    		  found = true;
    		  dir = 2;
    		}
        if (!found && pixel(x, y+1) == 0) {
    		  y++;
    		  found = true;
    		  dir = 1;
    		  }
        }

	      if (!found && dir == 2) { // Leftwards
    	    if (!found && pixel(x, y-1) == 0) {
    		  y--;
    		  found = true;
    		  dir = 3;
    		}
    		if (!found && pixel(x-1, y) == 0) {
    		  x--;
    		  found = true;
    		  dir = 2;
    		}
    		if (!found && pixel(x, y+1) == 0) {
    		  y++;
    		  found = true;
    		  dir = 1;
    		}
        if (!found && pixel(x+1, y) == 0) {
    		  x++;
    		  found = true;
    		  dir = 4;
    		}
      }
      xmin = Math.min(x, xmin);
      ymin = Math.min(y, ymin);
  	  xmax = Math.max(x, xmax);
  	  ymax = Math.max(y, ymax);
  	}

    return {xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax};
  }

  // Find blobs
  var blobs = [];
  for (var h = BLOB_SEARCH_BORDER; h < height - BLOB_SEARCH_BORDER; h++) {
	  if (blobs.length >= MAX_BLOBS_TO_FIND) break;

  	for (var j = BLOB_SEARCH_BORDER; j < width - BLOB_SEARCH_BORDER; j++) {
  	  if (pixel(j, h) == 0 && pixel(j, h-1) != 0) {
        var pos = tracePerim(j, h);

  	    if ((pos.xmax - pos.xmin) * (pos.ymax - pos.ymin) > 5) {
  		    blobs.push(pos);
  		    if (blobs.length >= MAX_BLOBS_TO_FIND) break;
  		  }
  	  }
  	}
  }

  // Sort blobs
  if (blobs.length < MIN_BLOBS_FOUND) {
	  return {error: {message: "Too few blobs: " + blobs.length, code: 1}};
  } else if (blobs.length > MAX_BLOBS_FOUND) {
    return {error: {message: "Too many blobs: " + blobs.length, code: 2}};
  }
  blobs.sort(function(a, b) {
    (b.xmax - b.xmin) * (b.ymax - b.ymin) - (a.xmax - a.xmin) * (a.ymax - a.ymin);
  });

  // prune duplicate blobs
  while (blobs.length >= 2 && blobs[1].xmax == blobs[0].xmax || blobs[1].xmin == blobs[0].xmin) {
    blobs.splice(1, 1);

    if (blobs.length < MIN_BLOBS_FOUND) {
      return {error: {message: "No blobs", code: 1}};
    }
  }
  if (blobs.length < MIN_BLOBS_FOUND) {
    return {error: {message: "No blobs", code: 1}};
  }

  // Check dimensions
  var xSep = Math.abs((blobs[0].xmax + blobs[0].xmin) - (blobs[1].xmax + blobs[1].xmin)) / 2;
  var ySep = Math.abs((blobs[0].ymax + blobs[0].ymin) - (blobs[1].ymax + blobs[1].ymin)) / 2;

  if (xSep < MIN_HOR_EYE_SEP || xSep > MAX_HOR_EYE_SEP || ySep > MAX_VERT_Y_SEP) {
	  return {error: {message: "Geometry off, xSep:" + xSep + ", ySep:" + ySep, code: 3}};
  }

  // Find which eye is which
  var l = (blobs[0].xmax < blobs[1].xmax)? 0 : 1;
  var r = (l == 0)? 1 : 0;

  // Expand bounding boxes
  var dx = 3;
  var dy = 3;
  return {
    leftEye: {
      x1: blobs[l].xmin - dx,
      x2: blobs[l].xmax + dx,
      y1: blobs[l].ymin - dy,
      y2: blobs[l].ymax + dy
    },
    rightEye: {
      x1: blobs[r].xmin - dx,
      x2: blobs[r].xmax + dx,
      y1: blobs[r].ymin - dy,
      y2: blobs[r].ymax + dy
    }
  }
}

var hasLogged = false;
onmessage = function(event) {
  var data = event.data;
  if (data.frame == null) { postMessage([-100]); }

  var res = search(data.frame, data.width, data.height);
  postMessage(res);
}
