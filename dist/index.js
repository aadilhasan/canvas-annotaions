const board = document.querySelector("#board");
const board2 = document.querySelector("#board2");
const container = document.querySelector(".container");
const image = document.querySelector("#img");
const ctx = board.getContext("2d");
const ctx2 = board2.getContext("2d");
let rects = [],
  addCommentVisible = false,
  defaultBorderColor = "black",
  unit_size = 0,
  hoveringOn,
  editingComment = false;
let messageDistanceFromRect = 3;
let mouseDown = false,
  sx,
  sy,
  cx,
  xy,
  rw = 0,
  rh = 0,
  bh = board.height,
  bw = board.width,
  commentInputOpen = false,
  currentRect;
let comment = document.querySelector("#comment");
let pin = document.querySelector("#pin"),
  pinHeight = 10,
  pinWidth = 110;
console.log(pin);
pin.onload = function() {
  console.log(" pin loaded");
};

// set predefined comments
let old_width = 300,
  old_height = 200,
  new_width = 500,
  new_height = 500,
  one_percent_of_old_width = old_width / 100,
  one_percent_of_old_height = old_height / 100,
  one_percent_of_new_width = new_width / 100,
  one_percent_of_new_height = new_height / 100;

let temp_rects = [
  {
    x: 41,
    y: 35,
    height: 41,
    width: 52,
    text: "xx",
    borderColor: "red"
  },
  {
    x: 253,
    y: 50,
    height: 21,
    width: 53,
    text: "pp",
    borderColor: "blue"
  }
];

image.onload = function(e) {
  board.width = image.width;
  board.height = image.height;
  board2.width = image.width;
  board2.height = image.height;

  // set pixel size for
  new_width = image.width;
  new_height = image.height;
  one_percent_of_new_width = new_width / 100;
  one_percent_of_new_height = new_height / 100;

  temp_rects.forEach(e => {
    let t = {
      x: e.x / one_percent_of_old_width,
      y: e.y / one_percent_of_old_height,
      height: e.height / one_percent_of_old_height,
      width: e.width / one_percent_of_old_width,
      text: e.text,
      borderColor: e.borderColor
    };
    if (t.text && t.text.length > 0) {
      rects.push(t);
    }
  });
  setTimeout(() => {
    drawExistingRects();
  }, 1000);
};

function shape(obj) {
  this.x = obj.x;
  this.y = obj.y;
  this.height = obj.height;
  this.width = obj.width;
}

function clear() {
  ctx.clearRect(0, 0, image.width, image.height);
}

function clearAll() {
  ctx.clearRect(0, 0, image.width, image.height);
  ctx2.clearRect(0, 0, image.width, image.height);
}

function drawExistingRects(context = ctx) {
  clear();
  if (rects.length > 0) {
    rects.forEach(rect => {
      context.strokeStyle = rect.borderColor || defaultBorderColor;
      rect = rectDimentionInPixels({
        x: rect.x,
        y: rect.y,
        height: rect.height,
        width: rect.width
      });
      context.strokeRect(rect.x, rect.y, rect.height, rect.width);
      console.log(" drawing image at : ", 10, rect.x + rect.width - 10);
      context.drawImage(pin, rect.x + rect.height - 8, rect.y - 10, 20, 20);
    });
  }
}

function copyCanvas({ from, to }) {
  console.log(" copying :: ", from, to);
  to.drawImage(from, 0, 0);
}

function redraw(x, y, height, width) {
  console.log(" redrawing");
  rects.forEach(rect => {
    let endX = rect.x + rect.height,
      endY = rect.y + rect.width;
    console.log(
      x >= rect.x,
      x <= endX,
      y >= rect.y,
      y <= endY,
      rect.width,
      rect.height
    );
    if (x >= rect.x && x <= endX && y >= rect.y && y <= endY) {
      console.log(" start intersecting");
    } else if (
      height >= endX &&
      height <= rect.height &&
      width >= endY &&
      width <= rect.width
    ) {
      console.log(" end intersecting");
    }
    ctx.strokeRect(rect.x, rect.y, rect.height, rect.width);
  });
}

function rectDimentionInPercentage({ x, y, height, width, text, borderColor }) {
  return {
    x: x / one_percent_of_new_width,
    y: y / one_percent_of_new_height,
    height: height / one_percent_of_new_height,
    width: width / one_percent_of_new_width,
    text: text,
    borderColor: borderColor
  };
}

function rectDimentionInPixels({ x, y, height, width, text, borderColor }) {
  return {
    x: x * one_percent_of_new_width,
    y: y * one_percent_of_new_height,
    height: height * one_percent_of_new_height,
    width: width * one_percent_of_new_width,
    text: text,
    borderColor: borderColor
  };
}

const addComment = document.querySelector("#add-comment");
const closeComment = document.querySelector("#close-comment");
const commentInput = document.querySelector("#comment-input");
const editComment = document.querySelector(".edit-comment");
const deleteComment = document.querySelector(".delete-comment");

function resetCommentInput() {
  commentInputOpen = false;
  currentRect = null;
  commentInput.value = "";
  comment.style.top = 0;
  comment.style.left = `${-100}vh`;
  addCommentVisible = false;
  editingComment = false;
  drawExistingRects();
}

addComment.addEventListener("click", e => {
  console.log(" clicked add ", commentInput.value, rects);
  if (commentInput.value.length > 0) {
    if (editingComment && hoveringOn) {
      rects[hoveringOn.rectIndex].text = commentInput.value;
      resetCommentInput();
      return;
    }

    if (currentRect !== undefined || currentRect !== null) {
      currentRect.text = commentInput.value;
      if (currentRect.text && currentRect.text.length > 0) {
        rects.push(currentRect);
      }
      addCommentVisible = false;
      resetCommentInput();
    }
  }
});

closeComment.addEventListener("click", e => {
  resetCommentInput();
});

board.addEventListener("click", e => {
  if (addCommentVisible || !hoveringOn) return;
  let HO = hoveringOn.rect;
  commentView.style = {};
  comment.style.top = `${HO.width + HO.y + messageDistanceFromRect}px`;
  comment.style.left = `${HO.x}px`;
  editingComment = true;
  addCommentVisible = true;
  commentInput.value = HO.text;
});

editComment.addEventListener("click", e => {
  console.log(" editing :: ", hoveringOn, !!hoveringOn);
  if (!hoveringOn) return;
  let HO = hoveringOn.rect;
  commentView.style = {};
  comment.style.top = `${HO.width + HO.y + messageDistanceFromRect}px`;
  comment.style.left = `${HO.x}px`;
  editingComment = true;
  addCommentVisible = true;
  commentInput.value = HO.text;
});

deleteComment.addEventListener("click", e => {
  console.log(" deleting :: ", editingComment, hoveringOn);
  if (!hoveringOn) return;

  if (hoveringOn) {
    rects.splice(hoveringOn.rectIndex, 1);
    commentText.innerHTML = "";
    commentView.style = {};
    hoveringOn = null;
    clearAll();
    drawExistingRects();
    return;
  }
});

board.onmousedown = e => {
  mouseDown = true;
  if (commentText.innerHTML.length > 0) {
    commentText.innerHTML = "";
    commentView.style = {};
  }
  if (addCommentVisible) {
    console.log("addCommentVisible ", addCommentVisible);
    resetCommentInput();
    copyCanvas({ from: board2, to: ctx });
    ctx2.clearRect(0, 0, board2.height, board2.width);
  }
  copyCanvas({ from: board, to: ctx2 });
  let board_cord = container.getBoundingClientRect();
  addCommentVisible = false;
  sx = e.clientX - board_cord.x;
  sy = e.clientY - board_cord.y;
  cx = cy = null;
  console.log(sx, sy);
};

board.onmouseup = e => {
  mouseDown = false;
  let rect = {
    x: sx,
    y: sy,
    height: rw,
    width: rh
  };
  rect = rectDimentionInPercentage(rect);
  if (rw < 10 && rh < 10) return;
  addCommentVisible = true;
  currentRect = new shape(rect);
  console.log(
    " total rects :: ",
    rect,
    `${sy + rh + messageDistanceFromRect}px`,
    `${sx}px`
  );
  // ctx.strokeRect(rect.x, rect.y, rect.height, rect.width);
  let board_cord = container.getBoundingClientRect();
  comment.style.top = `${sy + rh + messageDistanceFromRect}px`;
  comment.style.left = `${sx}px`;
  commentInputOpen = true;
  sx = sy = cx = cy = null;
  rw = rh = 0;
};

let commentView = document.querySelector(".comment-view");
let commentText = document.querySelector(".comment-text");
const commentViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  textAlign: "center",
  backgroundColor: "gray"
};
function checkHover(x, y) {
  let l = rects.length,
    i = 0,
    pos = board.getBoundingClientRect();
  for (i; i < l; i++) {
    let r = rectDimentionInPixels(rects[i]);
    let xt = r.x,
      yt = r.y,
      h = r.height,
      w = r.width;
    if (
      x >= pos.left + xt &&
      x <= pos.left + xt + h &&
      (y >= pos.top + yt && y <= pos.top + yt + w)
    ) {
      // console.log(' in =>>>>>>>', x, '>=', '(', pos.left, '+', xt, ')', '&&', x, '<=', pos.left, '+', xt, '+', h, ')', '&&', '(', y, '>=', pos.top, '+', yt, '&&', y, '<=', pos.top, '+', yt, '+', w, ')');

      commentView.style.top = `${w + yt + messageDistanceFromRect}px`;
      commentView.style.left = `${xt}px`;
      // commentView.style.height = `${w / 2}px`;
      // commentView.style.width = `${h * 2}px`;
      if (commentText.innerHTML.length == 0) {
        commentText.innerHTML = r.text;
      }

      hoveringOn = {
        rectIndex: i,
        rect: r
      };

      return;
    } else {
      //       console.log('out <<<<<<<<<<<==', x, '>=', '(',  pos.left , '+', xt, ')', '&&', x, '<=', pos.left, '+', xt, '+', h, ')', '&&', '(', y, '>=',  pos.top, '+', yt,  '&&',  y, '<=', pos.top, '+', yt, '+', w, ')');
      if (commentText.innerHTML.length) {
        commentText.innerHTML = "";
        commentView.style = {};
        hoveringOn = null;
      }
    }
  }
}

board.onmousemove = e => {
  let board_cord = container.getBoundingClientRect();
  cx = e.clientX - board_cord.x;
  cy = e.clientY - board_cord.y;

  if (!mouseDown) {
    if (!addCommentVisible) {
      checkHover(e.clientX, e.clientY);
    }
    return;
  }
  rw = cx - sx;
  rh = cy - sy;
  //   redraw(cx, cy, rh, rw);
  clear();
  ctx.strokeRect(sx, sy, rw, rh);
};

if (!board.getContext) {
  alert(" canvas not supported");
}
