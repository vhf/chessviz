"use strict";

var board;
var game = new Chess();
var statusEl = $('#status');
var fenArray = ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
                "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2",
                "rnbqkbnr/ppp1pppp/8/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R b KQkq - 1 2",
                "rnbqkbnr/ppp2ppp/8/3pp3/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq e6 0 3",
                "rnbqkbnr/ppp2ppp/8/3pN3/3P4/8/PPP1PPPP/RNBQKB1R b KQkq - 0 3",
                "rnbqkbnr/ppp3pp/5p2/3pN3/3P4/8/PPP1PPPP/RNBQKB1R w KQkq - 0 4",
                "rnbqkbnr/ppp3pp/5p2/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R b KQkq - 1 4",
                "rn1qkbnr/ppp3pp/5p2/3p4/3P2b1/5N2/PPP1PPPP/RNBQKB1R w KQkq - 2 5",
                "rn1qkbnr/ppp3pp/5p2/3p4/3P2b1/2N2N2/PPP1PPPP/R1BQKB1R b KQkq - 3 5"
               ];
var pgnArray = ["", "1. d4", "1. d4 d5", "1. d4 d5 2. Nf3", "1. d4 d5 2. Nf3 e5", "1. d4 d5 2. Nf3 e5 3. Nxe5", "1. d4 d5 2. Nf3 e5 3. Nxe5 f6", "1. d4 d5 2. Nf3 e5 3. Nxe5 f6 4. Nf3", "1. d4 d5 2. Nf3 e5 3. Nxe5 f6 4. Nf3 Bg4", "1. d4 d5 2. Nf3 e5 3. Nxe5 f6 4. Nf3 Bg4 5. Nc3"];
var movesArray = [{source: "d2", target: "d4"}, {source: "d7", target: "d5"}, {source: "g1", target: "f3"}, {source: "e7", target: "e5"}, {source: "f3", target: "e5"}, {source: "f7", target: "f6"}, {source: "e5", target: "f3"}, {source: "c8", target: "g4"}, {source: "b1", target: "c3"}];
var fenEl = $('#fen');
var pgnEl = $('#pgn');
var $slider = $('#slider');

$slider.attr('max', fenArray.length-1);

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

  movesArray.push({source: source, target: target});

  updateStatus();
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
  // pgnArray.push(game.pgn());
  // fenArray.push(game.fen());
  $slider.attr('max', fenArray.length-1);
};

var cfg = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};
board = new ChessBoard('board', cfg);

var updateDisplay = function(i) {
  if(typeof i === 'number') {
    $slider.val(i);
  }
};

updateStatus();
updateDisplay();

$('#replay').on('click', function() {
  var lastTime = new Date().getTime();
  var i = 0;
  var tick = function() {
    var thisTime = new Date().getTime();
    if (thisTime - lastTime > 1000) {
      updateDisplay(i);
      lastTime = thisTime;
      board.position(fenArray[i]);
      i += 1;
    }
    if (i < fenArray.length) {
      requestAnimationFrame(tick);
    }
  };
  tick();
});

$slider.on('change', function() {
  board.position(fenArray[$(this).val()]);
  updateStatus();
  updateDisplay();
});
