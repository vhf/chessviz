"use strict";

var $ = $, t = t;
var board;
var game = new Chess();
var statusEl = $('#status');
var fenEl = $('#fen');
var pgnEl = $('#pgn');
var $slider = $('#slider');
var replaying;


var depth = function(tree) {
  var i = 0;
  t.dfs(tree, function(node, par, ctrl) {
    i++;
  });
  return i;
};



var fenTree = {
  id: 0,
  pos: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  children: [{
    id: 1,
    pos: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
    children: [{
      id: 2,
      pos: "rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 2"
    }]
  }]
};

var nextNodeId = depth(fenTree);
$slider.attr('max', nextNodeId-1);

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
    nextNodeId = depth(fenTree);

    var deepestNode = t.find(fenTree, function (node) {
      return node.id === nextNodeId-1;
    });

    deepestNode.children = [];
    deepestNode.children.push({
      id: nextNodeId++,
      pos: game.fen()
    });
  }

  console.log(depth(fenTree));
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

  $slider.attr('max', nextNodeId-1);
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
  render(fenTree, true);

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
    updateDisplay();
  }
});

$slider.on('input', function(){
  var self = this;
  var node = t.find(fenTree, function (node) {
    return node.id === parseInt(self.value, 10);
  });
  board.position(node.pos);
});

board = new ChessBoard('board', cfg);
updateStatus();
updateDisplay();
//$slider.prop('disabled', true);
