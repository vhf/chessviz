"use strict";

var $ = $, t = t;
var board;
var game = new Chess();
var statusEl = $('#status');
var fenEl = $('#fen');
var pgnEl = $('#pgn');
var $slider = $('#slider');
var replaying;
var currentNode;


//returns the maximum depth of the graph
var depth = function(node) {
  if (!node.hasOwnProperty('children') || node.children.length === 0) {
    return 1;
  } else {
    var max = 0;
    for (var i = 0; i < node.children.length; i += 1) {
      var depthSubgraph = depth(node.children[i]);
      if (depthSubgraph > max) {
        max = depthSubgraph;
      }
    }
    return max+1;
  }
};

var getDeepestNode = function(tree) {
  return t.find(fenTree, function (node) {
    return node.id === depth(tree);
  });
};

var getRootNode = function(tree) {
  return t.find(fenTree, function (node) {
    return node.id === 0;
  });
};

var insertBelow = function(parent, child) {
  if (!parent.hasOwnProperty('children')) {
    parent.children = [];
  }
  parent.children.push(child);
};


var fenTree = {
  id: 0,
  pos: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  children: [{
    id: 1,
    pos: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
    children: [{
      id: 2,
      pos: "rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 2",
      children: []
    }]
  }]
};

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
var onDragStart = function(source, piece, position, orientation) {
  if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
};

var onDrop = function(source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';
  updateStatus();


  if ($('#record').is(':checked')) {
    var deepestNode = getDeepestNode(fenTree);
    var newNode;
    if (currentNode !== deepestNode) {
      console.log('forking a game');
      newNode = {
        id: nextNodeId++,
        pos: game.fen(),
        children: []
      };
      insertBelow(currentNode, newNode);
      currentNode = newNode;
    } else {
      console.log('continuing a game');
      newNode = {
        id: nextNodeId++,
        pos: game.fen(),
        children: []
      };
      insertBelow(deepestNode, newNode);
      currentNode = newNode;
    }
  }

  updateDisplay();
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
  board.position(game.fen());
};

var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  statusEl.html(status);
  fenEl.html(game.fen());
  pgnEl.html(game.pgn());
};

var cfg = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};

var updateDisplay = function(i) {
  if(typeof i === 'number') {
    $slider.val(i);
  }
  $('#depth').html(depth(fenTree));
  render(getRootNode(), true);

  setSliderMax(depth(fenTree)-1);
};

var setSliderMax = function(max) {
  console.log('set max to ', depth(fenTree));
  $slider.attr('max', max);
};



$('#replay').on('click', function() {
  var lastTime = new Date().getTime();
  var i = 0;
  replaying = true;
  var tick = function() {
    var thisTime = new Date().getTime();
    if (thisTime - lastTime > 1000) {
      updateDisplay(i);
      lastTime = thisTime;

      var node = t.find(fenTree, function (node) {
        return node.id === i;
      });

      board.position(node.pos);
      game = new Chess(node.pos);
      i += 1;
    }
    if (i < nextNodeId) {
      requestAnimationFrame(tick);
    } else {
      replaying = false;
    }
  };
  tick();
});


$('#record').on('change', function() {
  if($(this).is(':checked')) {
    fenTree = {
      id: 0,
      pos: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      children: []
    };
    game = new Chess();
    board.position(fenTree.pos);
    currentNode = fenTree;
    setSliderMax(depth(fenTree)-1);
    updateDisplay();
  }
  nextNodeId = 1;
});

$slider.on("input", function(){
  var self = this;
  currentNode = t.find(fenTree, function (node) {
    return node.id === parseInt(self.value, 10);
  });
  game = new Chess(currentNode.pos);
  board.position(currentNode.pos);
});

function click(d) {
  $('#slider').val(d.id);
  board.position(d.pos);
}

var nextNodeId = depth(fenTree);


board = new ChessBoard('board', cfg);
updateStatus();
updateDisplay();
