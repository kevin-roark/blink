function search(frame, width, height) {
  var kMaxBlobsToFind = 30;
  var kBlobsSearchBorder = 20;
  var kMinBlobsFound = 2;
  var kMaxBlobsFound = 25;
  var kMinEyeXSep = 40;
  var kMaxEyeXSep = 60;
  var kMaxEyeYSep = 40;

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
	  var xmin = i
	  var xmax = i;
	  var ymin = j;
	  var ymax = j;
    var dir = 1;

    for (count = 0; count < 300; count++) {
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
  var blobs = new Array();
  for (var h = kBlobsSearchBorder; h < height - kBlobsSearchBorder; h++) {
	  if (blobs.length >= kMaxBlobsToFind) break;

  	for (var j = kBlobsSearchBorder; j < width - kBlobsSearchBorder; j++) {
  	  if (pixel(j, h) == 0 && pixel(j, h-1) != 0) {
        var pos = tracePerim(j, h);

  	    if ((pos.xmax - pos.xmin) * (pos.ymax - pos.ymin) > 5) {
  		    blobs.push(pos);
  		    if (blobs.length >= kMaxBlobsToFind) break;
  		  }
  	  }
  	}
  }

  // Sort blobs
  if (blobs.length < kMinBlobsFound) {
	  return {error: "No blobs"};
  } else if (blobs.length > kMaxBlobsFound) {
    return {error: "Too many blobs: " + blobs.length};
  }
  blobs.sort(function(a, b) { (b.xmax - b.xmin) * (b.ymax - b.ymin) - (a.xmax - a.xmin) * (a.ymax - a.ymin) });

  // Check dimensions
  var xSep = Math.abs((blobs[0].xmax + blobs[0].xmin) - (blobs[1].xmax + blobs[1].xmin)) / 2;
  var ySep = Math.abs((blobs[0].ymax + blobs[0].ymin) - (blobs[1].ymax + blobs[1].ymin)) / 2;

  if (xSep < kMinEyeXSep || xSep > kMaxEyeXSep || ySep > kMaxEyeYSep) {
	  return {error: "Geometry off, xSep:" + xSep + ", ySep:" + ySep};
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
    rightEye {
      x1: blobs[r].xmin - dx,
      x2: blobs[r].xmax + dx,
      y1: blobs[r].ymin - dy,
      y2: blobs[r].ymax + dy
    }
  }
}

onmessage = function(event) {
  var data = event.data;
  if (data.frame == null) { postMessage([-100]); }
  var res = search(data.frame, data.width, data.height);
  postMessage(res);
}
