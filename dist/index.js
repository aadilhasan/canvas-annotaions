(function(window) {
  let board,
    board2,
    container,
    image,
    ctx,
    ctx2,
    comment,
    contexes = {},
    currentCanvasSrc,
    initialized = false;
  let editable = true;
  let rects = [],
    addCommentVisible = false,
    defaultBorderColor = "black",
    unit_size = 0,
    hoveringOn,
    editingComment = false;
  let messageDistanceFromRect = 10;
  let mouseDown = false,
    sx,
    sy,
    cx,
    cy,
    rw = 0,
    rh = 0,
    bh,
    bw,
    currentRect;
  let lifeHooks = {};
  let pin = $("#pin"),
    pinHeight = 10,
    pinWidth = 110;
  // console.log(pin);
  let radius = 10;
  let commentView, commentText;
  // pin.onload = function () {
  //     // console.log(' pin loaded');
  // }

  // set predefined comments
  let old_width,
    old_height,
    new_width,
    new_height,
    one_percent_of_old_width,
    one_percent_of_old_height,
    one_percent_of_current_canvas_width,
    one_percent_of_current_canvas_height;

  let temp_rects = [
    {
      x: 8.8,
      y: 52.7027027027027,
      radius: 2,
      imageUrl: "http://i.imgur.com/yf6d9SX.jpg",
      text: "far"
    },
    {
      x: 63,
      y: 19.06906906906907,
      radius: 2,
      imageUrl: "http://i.imgur.com/yf6d9SX.jpg",
      text: "eye"
    },
    {
      x: 89.8,
      y: 47.8978978978979,
      radius: 2,
      imageUrl: "http://i.imgur.com/yf6d9SX.jpg",
      text: "another head"
    },
    {
      x: 50.666666666666664,
      y: 4.4,
      radius: 3.3333333333333335,
      imageUrl:
        "http://1.bp.blogspot.com/-J9iv7rouy_k/Uq1cONKV6jI/AAAAAAAACfA/LfFlwyYC8B8/s1600/Online+house+map+30x60.jpg",
      text: "30 again"
    },
    {
      x: 63.6,
      y: 32.08,
      radius: 2,
      imageUrl:
        "http://1.bp.blogspot.com/-J9iv7rouy_k/Uq1cONKV6jI/AAAAAAAACfA/LfFlwyYC8B8/s1600/Online+house+map+30x60.jpg",
      text: "dinning table"
    },
    {
      x: 27.4,
      y: 30.48,
      radius: 2,
      imageUrl:
        "http://1.bp.blogspot.com/-J9iv7rouy_k/Uq1cONKV6jI/AAAAAAAACfA/LfFlwyYC8B8/s1600/Online+house+map+30x60.jpg",
      text: "washroom"
    }
  ];

  /**
   * take query and find element using it
   *
   * @param {string} query
   *
   * @return {node}
   */

  function $(query) {
    return document.querySelector(query);
  }

  /**
   * find child element of a given elment by it's name
   *
   * @param {node} el
   * @param {string} childClassName
   *
   * @return {el}
   */
  function findChildByClassName(el, childClassName) {
    let children = el.children;
    let i = 0,
      l = children.length;
    for (i; i < l; i++) {
      let child = children[i];
      if (children[i].classList.contains(childClassName)) {
        return children[i];
      }
      if (child.children) {
        let el = findChildByClassName(child, childClassName);
        if (el !== null) {
          return el;
        }
      }
    }
    return null;
  }

  // shape
  function shape(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.height = obj.height;
    this.width = obj.width;
  }

  // clear front canvas
  const clear = function() {
    if (!initialized) return;
    ctx.clearRect(0, 0, image.width, image.height);
  };

  // clear both canvas
  function clearAll() {
    ctx.clearRect(0, 0, image.width, image.height);
    ctx2.clearRect(0, 0, image.width, image.height);
  }

  /**
   * draw existing shapse on the canvas
   *
   * @param {object} context
   *
   */

  function drawExistingShapes(context = ctx) {
    // first clear canvas
    clear();

    if (rects.length > 0) {
      rects.forEach(rect => {
        if (rect.imageUrl) {
          // get the context of the canvas of a particular image
          let ctx = contexes[rect.imageUrl];
          if (!ctx) {
            return;
          }

          context = ctx.ctx;
        }

        if (currentCanvasSrc && rect.imageUrl != currentCanvasSrc) {
          return;
        }
        // set style for the shape
        context.strokeStyle = rect.borderColor || defaultBorderColor;
        context.beginPath();

        let arc = {
          x: rect.x * one_percent_of_current_canvas_width,
          y: rect.y * one_percent_of_current_canvas_height,
          radius: rect.radius * one_percent_of_current_canvas_width,
          text: rect.text,
          borderColor: rect.borderColor
        };
        context.arc(arc.x, arc.y, arc.radius, 0, 2 * Math.PI);
        context.strokeStyle = "#51c96f";
        context.fillStyle = "#51c96f73";
        context.fill();

        // draw circle on the canvas
        context.stroke();
      });
    }
  }

  /**
   * copy a canvas to another one
   *
   * @param {context} from
   * @param {context} to
   *
   */
  function copyCanvas({ from, to }) {
    to.drawImage(from, 0, 0);
  }

  let addComment = null,
    closeComment = null,
    commentInput = null,
    editComment = null,
    deleteComment = null;

  /**
   * reset comment input box's value and draw existing shapes
   *
   * @param {boolean} redraw
   *
   */
  function resetCommentInput(redraw) {
    currentRect = null;
    commentInput.value = "";
    comment.style.top = 0;
    comment.style.left = `${-100}vh`;
    addCommentVisible = false;
    editingComment = false;
    // console.log(' redraw :: ', redraw);
    if (redraw === false) {
      return;
    }
    drawExistingShapes();
  }

  /**
   * add comment to the rects array and call reset input.
   *
   * @param {object} shape
   * @param {boolean} redraw
   */

  const addCommentToBoard = function(shape, redraw) {
    if (commentInput.value.length > 0 || (shape && shape.text)) {
      if (editingComment && hoveringOn) {
        rects[hoveringOn.rectIndex].text = commentInput.value;
        if (lifeHooks["onEdited"]) {
          let shapeForImage = [],
            url = rects[hoveringOn.rectIndex].imageUrl;
          rects.forEach(rect => {
            if (rect.imageUrl == url) {
              shapeForImage.push(rect);
            }
          });
          lifeHooks["onEdited"](
            rects[hoveringOn.rectIndex],
            shapeForImage,
            rects
          );
        }
        resetCommentInput(redraw);
        return;
      }
      if (shape && shape.text.length > 0) {
        currentRect = shape;
      }

      if (currentRect !== undefined || currentRect !== null) {
        currentRect.text = commentInput.value || shape.text;
        if (currentRect.text && currentRect.text.length > 0) {
          currentRect.x = currentRect.x / one_percent_of_current_canvas_width;
          currentRect.y = currentRect.y / one_percent_of_current_canvas_height;
          currentRect.radius =
            currentRect.radius / one_percent_of_current_canvas_width;
          if (!currentRect.imageUrl) {
            currentRect.imageUrl = shape.imageUrl;
          }
          rects.push(currentRect);
          if (redraw !== false) {
            if (lifeHooks["onShapeAdded"]) {
              let shapeForImage = [];
              rects.forEach(rect => {
                if (rect.imageUrl == currentRect.imageUrl) {
                  shapeForImage.push(rect);
                }
              });
              console.log(currentRect, shapeForImage, rects);
              lifeHooks["onShapeAdded"](currentRect, shapeForImage, rects);
            }
          }
        }
        addCommentVisible = false;
        resetCommentInput(redraw);
      }
    }
  };

  //  style for comment view
  const commentViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    textAlign: "center",
    backgroundColor: "gray"
  };

  /**
   * check on hover over the canvas that is the cursor over a shape
   *
   * @param {integer} x
   * @param {integer} y
   *
   */
  function checkHover(x, y) {
    let l = rects.length,
      i = 0,
      pos = board.getBoundingClientRect();
    for (i; i < l; i++) {
      if (rects[i].radius) {
        let tx = x - pos.x,
          ty = y - pos.y;
        let bubble = Object.assign({}, rects[i]);
        bubble.x = bubble.x * one_percent_of_current_canvas_width;
        bubble.y = bubble.y * one_percent_of_current_canvas_height;
        bubble.radius = bubble.radius * one_percent_of_current_canvas_width;
        let dx = tx - bubble.x,
          dy = ty - bubble.y,
          dist = Math.sqrt(dx * dx + dy * dy);

        // check if cursor in over this shape
        if (dist < bubble.radius) {
          commentView.style.top = `${bubble.y + bubble.radius}px`;
          commentView.style.left = `${bubble.x}px`;
          if (commentText.innerHTML.length == 0) {
            commentText.innerHTML = bubble.text;
          }
          hoveringOn = {
            rectIndex: i,
            rect: bubble
          };
          return;
        } else {
          // if cursor in not over the shape hide comentView
          if (commentText.innerHTML.length) {
            commentText.innerHTML = "";
            commentView.style = {};
            hoveringOn = null;
          }
        }
      }
    }
  }

  /**
   * configure initial settings on a init.
   *
   * @param {node} e
   * @param {boolean} editable
   *
   */
  const initialDomConfigs = function(e, editable) {
    // set canvas height and width
    board.width = image.width;
    board.height = image.height;
    board2.width = image.width;
    board2.height = image.height;

    // add src-img attribute to both canvas so we can easily identify them.
    board.setAttribute("src-img", image.src);
    board2.setAttribute("src-img", image.src);
    (bh = board.height), (bw = board.width);

    // if user has passed editable=false then remove the bottom border and action button from text view.
    if (!editable) {
      let borderBottom = $("._comment-border");
      let commentActionButtons = $("._comment-view-action-btn");
      if (borderBottom) {
        borderBottom.remove();
      }
      if (commentActionButtons) {
        commentActionButtons.remove();
      }
    }

    // setn current img url to currn canvas source
    currentCanvasSrc = image.src;
    one_percent_of_current_canvas_width = image.width / 100;
    one_percent_of_current_canvas_height = image.height / 100;

    setTimeout(() => {
      drawExistingShapes();
    }, 1000);
  };

  // console log
  const log = function(msg) {
    console.log(msg);
  };

  // console warning
  const warn = function(msg) {
    console.warn(msg);
  };

  // console error
  const error = function(msg) {
    console.error(msg);
  };

  // add shape to the main rect and redraw
  const addShape = function(shape, imageUrl) {
    // if app in not initialized on current image then return;
    if (!initialized) return;

    // if input shape is of type array then add its target image url to it and call add multip;e
    if (Array.isArray(shape)) {
      shape = shape.map(s => {
        s.imageUrl = s.imageUrl ? s.imageUrl : imageUrl;
        return s;
      });
      addMultiple(shape);
      return;
    }

    //  if shape is an object then draw it on the board
    if (typeof shape == "object") {
      shape.imageUrl = imageUrl;
      addCommentToBoard(shape, false);
      drawExistingShapes();
      // console.log(rects);
      if (lifeHooks["onShapeAdded"]) {
        let shapeForImage = [];
        rects.forEach(rect => {
          if (rect.imageUrl == shape.imageUrl) {
            shapeForImage.push(rect);
          }
        });
        console.log(hape, shapeForImage, rects);
        lifeHooks["onShapeAdded"](shape, shapeForImage, rects);
      }
    }
  };

  /**
   * add multiple array to the board.
   *
   * @param {array} shapes
   * @param {string} unit
   */

  const addMultiple = function(shapes, unit = "%") {
    if (!initialized) return;
    // log an error if shapes is not an array
    if (!Array.isArray) {
      error(
        `addMultiple: Expected to be an array of objects, but found "${typeof shapes}"`
      );
      return;
    }

    shapes.forEach((shape, index) => {
      if (
        !shape.x ||
        !shape.y ||
        !shape.text ||
        shape.text.length == 0 ||
        !shape.radius
      ) {
        error(
          `addMultiple: Unable to add add a shape form index ${index}, shape is `,
          shape
        );
      } else {
        if ((shape.unit && shape.unit == "%") || unit == "%") {
          shape.x = shape.x * one_percent_of_current_canvas_width;
          shape.y = shape.y * one_percent_of_current_canvas_height;
          shape.radius = shape.radius * one_percent_of_current_canvas_width;
        }
        addCommentToBoard(shape, false);
      }
    });
    // draw existing shape when all shapes are added to current rect
    drawExistingShapes();

    // call hook
    if (lifeHooks["onMultipleAdded"]) lifeHooks["onMultipleAdded"](rects);
  };

  // add event listenters to the the elements
  function addEventListeners(el) {
    // front canvas
    board = findChildByClassName(el, "_board");
    // console.log(board);
    container = el;
    // rear canvas
    board2 = findChildByClassName(el, "_board2");
    addComment = findChildByClassName(el, "_add-comment");
    closeComment = findChildByClassName(el, "_close-comment");
    commentInput = findChildByClassName(el, "_comment-input");
    editComment = findChildByClassName(el, "_edit-comment");
    deleteComment = findChildByClassName(el, "_delete-comment");
    commentView = findChildByClassName(el, "_comment-view");
    commentText = findChildByClassName(el, "_comment-text");
    comment = findChildByClassName(el, "_comment");
    ctx = board.getContext("2d");
    ctx2 = board2.getContext("2d");
    let key = el.getAttribute("src-img");

    // save current image/context data to the contex object;
    contexes[key] = {
      ctx: ctx,
      ctx2: ctx2,
      height: board.height,
      width: board.width,
      container: el,
      board: board,
      board2: board2,
      comment: comment,
      commentInput: commentInput,
      editComment: editComment,
      deleteComment: deleteComment,
      commentView: commentView,
      commentText: commentText,
      rects: []
    };
    contexes[key].ctx2 = ctx2;

    board.onmousemove = e => {
      let board_cord;
      // when mouse moves over a canvas make that canvas 's src currentCanavas
      currentCanvasSrc = e.target.getAttribute("src-img");
      // set main values to target elements values
      if (Object.keys(contexes).length > 0) {
        let currentCanvas = contexes[currentCanvasSrc];
        ctx = currentCanvas.ctx;
        board = currentCanvas.board;
        rects = contexes[currentCanvasSrc].rects;
        commentView = currentCanvas.commentView;
        commentText = currentCanvas.commentText;
        board_cord = currentCanvas.board.getBoundingClientRect();
        one_percent_of_current_canvas_width = board.width / 100;
        one_percent_of_current_canvas_height = board.height / 100;
        container = currentCanvas.container;
      } else {
        board_cord = board.getBoundingClientRect();
      }
      cx = e.clientX - board_cord.x;
      cy = e.clientY - board_cord.y;

      // if mouse is clicked do not check for hover
      // it was ment for drawing recatange
      if (!mouseDown) {
        // if comment is visible do not check
        if (!addCommentVisible) {
          checkHover(e.clientX, e.clientY);
        }
        return;
      }
      rw = cx - sx;
      rh = cy - sy;
      //   redraw(cx, cy, rh, rw);
      clear();
      // draw if user clicked
      ctx.strokeRect(sx, sy, rw, rh);
    };

    // on click ok on adding comment add comment to currenct rect;
    addComment.addEventListener("click", e => {
      addCommentToBoard();
    });

    // reset input on cancle clicked
    closeComment.addEventListener("click", e => {
      resetCommentInput();
    });

    board.addEventListener("click", e => {
      // if there is no contexs then return;
      if (Object.keys(contexes).length == 0) return;
      let target = e.target;
      one_percent_of_current_canvas_height = target.height / 100;
      one_percent_of_current_canvas_width = target.width / 100;
      let canvasImage = e.target.getAttribute("src-img");
      let currentCanvas = contexes[canvasImage];
      // if canvas is not editable the return;
      if (!currentCanvas.editable) return;

      // set main context
      ctx = currentCanvas.ctx;

      let board_cord = currentCanvas.container.getBoundingClientRect();

      //  check if add comment is visible
      if (addCommentVisible == true) {
        // console.log(' add comment visible ', hoveringOn);

        if (hoveringOn) {
          let bubble = Object.assign({}, hoveringOn.rect);
          let tx = e.clientX - board_cord.x,
            ty = e.clientY - board_cord.y;
          bubble.x = bubble.x * one_percent_of_current_canvas_width;
          bubble.y = bubble.y * one_percent_of_current_canvas_height;
          bubble.radius = bubble.radius * one_percent_of_current_canvas_width;
          let dx = tx - bubble.x,
            dy = ty - bubble.y,
            dist = Math.sqrt(dx * dx + dy * dy);
          // hide comemnt inut if clicked outside of the rect in which add/edit comment  is showing.
          if (dist > bubble.radius) {
            log("clicked outside bubble");
            resetCommentInput();
          }
        }
        return;
      }

      if (Object.keys(contexes).length > 0) {
        let currentCanvas = contexes[e.target.getAttribute("src-img")];
        ctx = currentCanvas.ctx;
        board_cord = currentCanvas.container.getBoundingClientRect();
        container = currentCanvas.container;
        comment = currentCanvas.comment;
        commentInput = currentCanvas.commentInput;
      }
      let current_cord = {
        x: e.clientX - board_cord.x,
        y: e.clientY - board_cord.y,
        radius: radius,
        imageUrl: canvasImage ? canvasImage : ""
      };
      // console.log(e, current_cord, container, container.getBoundingClientRect());
      ctx.beginPath();
      ctx.arc(
        current_cord.x,
        current_cord.y,
        current_cord.radius,
        0,
        2 * Math.PI
      );

      // draw arc where use clicked
      ctx.stroke();
      // set drawn rect to current rect
      currentRect = current_cord;
      // addd style add comment input view
      comment.style.top = `${current_cord.y + current_cord.radius}px`;
      comment.style.left = `${current_cord.x}px`;

      //make current rect as hovering rect
      hoveringOn = {
        rectIndex: rects.length,
        rect: {}
      };

      hoveringOn.rect.x = currentRect.x / one_percent_of_current_canvas_width;
      hoveringOn.rect.y = currentRect.y / one_percent_of_current_canvas_height;
      hoveringOn.rect.radius =
        currentRect.radius / one_percent_of_current_canvas_width;
      addCommentVisible = true;
      // focus on add comment input
      currentCanvas.commentInput.focus();
    });

    // on click on edit comment show edit comment view
    editComment.addEventListener("click", e => {
      // console.log(' editing :: ', hoveringOn, !!hoveringOn);
      if (!hoveringOn) return;
      let HO = hoveringOn.rect;
      commentView.style = {};
      if (HO.radius) {
        comment.style.top = `${HO.y + HO.radius}px`;
        comment.style.left = `${HO.x}px`;
      } else {
        comment.style.top = `${HO.width + HO.y + messageDistanceFromRect}px`;
        comment.style.left = `${HO.x}px`;
      }
      editingComment = true;
      addCommentVisible = true;
      commentInput.value = HO.text;
    });

    // on click on delete comment, delete comment and redraw
    deleteComment.addEventListener("click", e => {
      if (!hoveringOn) return;

      if (hoveringOn) {
        let temp = Object.assign({}, rects[hoveringOn.rectIndex]);
        rects.splice(hoveringOn.rectIndex, 1);
        if (lifeHooks["onDeleted"]) {
          let shapeForImage = [];
          rects.forEach(rect => {
            if (rect.imageUrl == temp.imageUrl) {
              shapeForImage.push(rect);
            }
          });
          lifeHooks["onDeleted"]({}, shapeForImage, rects);
        }
        commentText.innerHTML = "";
        commentView.style = {};
        hoveringOn = null;
        clearAll();
        drawExistingShapes();
        return;
      }
    });
  }

  /**
   * convert string to dom elemnt
   *
   * @param {string} html
   */
  var str2DOMElement = function(html) {
    var frame = document.createElement("iframe");
    frame.style.display = "none";
    document.body.appendChild(frame);
    frame.contentDocument.open();
    frame.contentDocument.write(html);
    frame.contentDocument.close();
    var el = frame.contentDocument.body.firstChild;
    document.body.removeChild(frame);
    return el;
  };

  /**
   * create container for the image
   *
   * @param {image} img
   *
   */
  function createContainer(img) {
    let container = str2DOMElement(`<div class="_container">
            <canvas class="_board" style="background-color:transparent"></canvas>
            <canvas class="_board2" style="background-color:transparent"></canvas>
            <div class="_comment">
                <div>
                    <textarea class="_comment-input" placeholder="Add a comment"></textarea>
                    <div class="_border-bottom"></div>
                </div>
                <div class="_comment-input-action-btn">
                    <button class="_add-comment">Save</button>
                    <button class="_close-comment">Cancle</button>
                </div>
            </div>
            <div class="_comment-view">
                <div class="_comment-text"></div>
                <div class="_comment-border _border-bottom"></div>
                <div class="_comment-view-action-btn">
                    <span class="_edit-comment">Edit</span>
                    <span class="_delete-comment">Delete</span>
                </div>
            </div>
    </div>`);

    container.setAttribute("src-img", img.src);
    let children = container.children;
    let board1 = children[0];
    let board2 = children[1];
    board1.setAttribute("src-img", img.src);
    board1.height = img.height;
    board1.width = img.width;
    board2.setAttribute("src-img", img.src);
    board2.height = img.height;
    board2.width = img.width;
    img.classList.add("initialized");
    container.insertBefore(img, board1);

    return container;
  }

  /**
   * init on the image
   *
   * @param {object} {el, shapes, config}
   *
   */
  const init = function({ el, shapes = [], config }) {
    initialized = true;

    // call init life hook
    if (lifeHooks["init"]) {
      lifeHooks["init"]();
    }

    if (config) {
      radius = config.radius;
      // buttonText = config.buttonText;
    }

    if (shapes && Array.isArray(shapes)) {
      rects = shapes;
    }

    // check if image is a dom element
    if (typeof el == "object") {
      if (el.nodeName !== "IMG") {
        error(
          `First argument was expected as a dom element, node type of IMG(image), but found "${
            el.nodeName
          }"`
        );
        return;
      }

      let elClasses = el.classList;
      // check if the provided el is already initialized
      if (elClasses && elClasses.contains("initialized")) {
        error(`Canvas has already initialized with this image `);
        return;
      }

      image = el;
      let imageParent = image.parentNode;
      let container = createContainer(image);
      imageParent.appendChild(container);
      addEventListeners(container);
      let key = container.getAttribute("src-img");
      contexes[key].editable =
        config && config.editable == false ? false : true;
      contexes[key].rects = shapes;
    } else {
      error(
        `First argument is expected to be a dom elment but "${el}" is not a dom element`
      );
      return;
    }

    if (shapes && !Array.isArray(shapes)) {
      error(
        ` Second argument is expected to be an array of objects, but found "${typeof shapes}"`
      );
      return;
    }

    log(`Calling drawExistingShapes`, rects);

    if (image.complete) {
      initialDomConfigs(
        image,
        config && config.editable == false ? false : true
      );
      if (Object.keys(contexes).length > 0) {
        let currentCanvas = contexes[currentCanvasSrc];
        ctx = currentCanvas.ctx;
        one_percent_of_current_canvas_width = currentCanvas.board.width / 100;
        one_percent_of_current_canvas_height = currentCanvas.board.height / 100;
        container = currentCanvas.container;
      }
    } else {
      log(" adding event listner to image");
      let editable = config && config.editable == false ? false : true;
      image.onload = function(e) {
        log(" image loaded ", e, image);
        initialDomConfigs(e, editable);
        if (Object.keys(contexes).length > 0) {
          let currentCanvas = contexes[currentCanvasSrc];
          ctx = currentCanvas.ctx;
          one_percent_of_current_canvas_width = currentCanvas.board.width / 100;
          one_percent_of_current_canvas_height =
            currentCanvas.board.height / 100;
          container = currentCanvas.container;
        }
      };
    }

    log(" finished init ");
  };
  const clearEveryThing = function() {
    if (!initialized) return;
    clear();
    rects = [];
  };

  const getAllShapes = function() {
    if (!initialized) return;
    return rects;
  };

  const addHandler = function(event, cb) {
    let events = event.split(",");
    events.forEach(event => {
      lifeHooks[event.trim()] = cb;
    });
    // console.log(' handler added : ', lifeHooks);
  };

  const canvas = {
    init: init,
    addShape: addShape,
    addMultiple: addMultiple,
    clear: clear,
    clearEveryThing: clearEveryThing,
    getAllShapes: getAllShapes,
    addHandler: addHandler
  };

  // expose functions to the user by adding them to window
  window.canvas = canvas;
})(window);
