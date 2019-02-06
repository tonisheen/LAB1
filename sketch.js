const size = 15;
const scale = 30;
let game;

function setup() {
    frameRate(5);
    createCanvas(size * scale, size * scale);

    game = new Game();
    game.dimensions = size;
    game.prepareNewGame();
}

function drawGrid(squares_on_edge, width_of_squares) {
    for (let i = 1; i <= squares_on_edge; i++) {
        line(i * width_of_squares, 0, i * width_of_squares, height);
        line(0, i * width_of_squares, width, i * width_of_squares);
    }
}

function renderCandy(candy = new Candy('red', 5)) {
    fill(candy.color);
    ellipse(candy.position.column * scale + scale * 0.5, candy.position.row * scale + scale * 0.5, 25, 25);
    noFill();
}

function renderBoard(board = new Board(5)) {
    drawGrid(board.boardSize, scale);
    board.allRows.forEach(row => {
        row.forEach(renderCandy)
    });
}

function highlightCrushes(game = new Game()) {
    fill('rgba(255,15,0, 0.4)');

    game.getCandyCrushes()[0]
        .filter(arr => arr.length > 0)
        .forEach(list_of_crushes => {
            list_of_crushes.forEach(list_of_candies => {
                const firstCandy = list_of_candies[0];
                rect(firstCandy.position.column * scale, firstCandy.position.row * scale, list_of_candies.length * scale, scale);
            })
        })

    game.getCandyCrushes()[1]
        .filter(arr => arr.length > 0)
        .forEach(list_of_crushes => {
            list_of_crushes.forEach(list_of_candies => {
                const firstCandy = list_of_candies[0];
                rect(firstCandy.position.column * scale, firstCandy.position.row * scale, scale, list_of_candies.length * scale);
            })
        })

    noFill();
}

function highlightMoves(moves) {

    // const neighbor = (position, direction) => {
    //     let delta = [0, 0];
    //     switch (direction) {
    //         case 'up': delta = [-1, 0]; break;
    //         case 'down': delta = [1, 0]; break;
    //         case 'left': delta = [0, -1]; break;
    //         case 'right': delta = [0, 1]; break;

    //         default: throw Error(`Expected up, down, left, right; got ${direction}`);
    //     }
    //     return position.neighbor(...delta);
    // }

    moves.flat().forEach(move => {
        fill('rgba(0,255,0, 0.4)');
        rect(move.candy.position.column * scale, move.candy.position.row * scale, scale, scale);

        // fill('rgba(0,255,0, 0.4)');
        // rect(neighbor(move.candy.position, move.direction).column * scale,
        //     neighbor(move.candy.position, move.direction).row * scale, 
        //     scale, scale
        // );
    })

    noFill();

}

function draw() {
    renderBoard(game.board);
    // highlightMoves(game.getAllValidMoves());

    let move = game.getRandomValidMove();
    // highlightMoves([move])

    game.makeMove(move.candy, move.direction);

    let crushes = game.getCandyCrushes().flat(2);
    while (crushes.length > 0) {
        // highlightCrushes(game);

        game.removeCrushes(crushes);
        game.moveCandiesDown();

        crushes = game.getCandyCrushes().flat(2);
    }
}

function mousePressed() {
    clear();
}