// const pickRandom = (arr) => { return arr[Math.floor(Math.random() * arr.length)]; };

// const randomCell = (num_rows, num_cols) => { return new Cell(Math.floor(Math.random() * num_rows), Math.floor(Math.random() * num_cols)); };

// const inGrid = (cell) => { return cell.row > -1 && cell.column > -1; };

/** 
//   const validate = function (isValid, msg, callback = () => { return true; }, args = [], thisArg = this) {
//     if (isValid) {
//         return callback.call(thisArg, ...args, true);
//     } else {
//         const err = new Error(msg);
//         throw err;
//     }
// };
*/

const LongestSequences = function (arr, min_length, equals = (a, b) => { return a == b; }) {
    const sequences = [];
    let [pin, scout] = [0, 1];

    while (scout <= arr.length) {

        const match = equals(arr[pin], arr[scout]);
        const edge = (scout == arr.length - 1);
        const end = match ? scout + 1 : scout;
        const longEnough = ((end - pin) >= min_length);

        if (!match || edge) {

            if (longEnough)
                sequences.push(arr.slice(pin, end));

            pin = scout;
        }

        scout++;
    }
    return sequences;
};

/**
// class EventTarget {
//     constructor() {
//         this.listeners = {};
//     }

//     addEventListener(type, callback) {
//         if (!(type in this.listeners)) {
//             this.listeners[type] = [];
//         }
//         this.listeners[type].push(callback);
//     }

//     removeEventListener(type, callback) {
//         if (!(type in this.listeners)) {
//             return;
//         }
//         var stack = this.listeners[type];
//         for (var i = 0, l = stack.length; i < l; i++) {
//             if (stack[i] === callback) {
//                 stack.splice(i, 1);
//                 return;
//             }
//         }
//     }

//     dispatchEvent(event) {
//         if (!(event.type in this.listeners)) {
//             return true;
//         }
//         var stack = this.listeners[event.type].slice();

//         for (var i = 0, l = stack.length; i < l; i++) {
//             stack[i].call(this, event);
//         }
//         return !event.defaultPrevented;
//     }
// }

// class CustomEvent {
//     constructor(type, detail = {}) {
//         this.type = type;
//         this.detail = detail;
//         this.defaultPrevented = false;
//     }
// }
*/

class Cell {
    constructor(row_num, col_num) {
        this.row_num = row_num;
        this.col_num = col_num;
    }

    get row() {
        return this.row_num;
    }

    get column() {
        return this.col_num;
    }

    toString() {
        return `Cell{row: ${this.row}, column: ${this.column}}`;
    }

    toArray() {
        return [this.row, this.column];
    }

    neighbor(row_diff, col_diff) {
        return new Cell(this.row + row_diff, this.column + col_diff);
    }
}

class Grid {
    constructor(num_rows, num_columns, val = null) {
        Grid.validateRowCol(num_rows, num_columns);
        this.rows = num_rows;
        this.columns = num_columns;
        this.slots = new Array(num_rows * num_columns).fill(val);
    }

    static flatIndex(num_columns, cell) {
        return (cell.row * num_columns) + cell.column;
    }

    static matrixIndex(num_columns, index) {
        return new Cell(Math.floor(index / num_columns), index % num_columns);
    }

    isValidCell(cell) {
        return Number.isInteger(cell.row) && Number.isInteger(cell.column) &&
            cell.row >= 0 && cell.column >= 0 &&
            cell.row < this.rows && cell.column < this.columns;
    }

    isEmptyCell(cell) {
        return this.getCell(cell) == null;
    }

    static validate(isValid, msg, callback = () => { return true; }, args = [], thisArg = this) {
        if (isValid) {
            return callback.call(thisArg, ...args, true);
        } else {
            const err = new Error(msg);
            throw err;
        }
    }

    static validateRowCol(num_rows, num_columns, type = 'Grid', callback = () => { return true; }, args = [], thisArg = this) {
        const isValid = num_rows > 0 && num_columns > 0 && Number.isInteger(num_rows) && Number.isInteger(num_columns);
        const error_msg = `Cannot initialize ${num_rows} by ${num_columns} ${type}`;

        return Grid.validate(isValid, error_msg, callback, args, thisArg);
    }

    validateCell(cell, callback = () => { return true; }, args = []) {
        const isValid = this.isValidCell(cell);
        const error_msg = `${cell.toString()} isn't valid cell in ${this.dimension} Grid`;
        const argv = [cell, ...args];

        return Grid.validate(isValid, error_msg, callback, argv, this);
    }

    validateIndex(index, max, callback, args = [], min = 0) {
        const isValid = index < max && index >= min;
        const error_msg = `Out of Index Error: ${index} not in range[${min}, ${max})`;
        const argv = [index, ...args];

        return Grid.validate(isValid, error_msg, callback, argv, this);
    }

    find(rule) {
        return Grid.matrixIndex(this.columns, this.slots.findIndex(rule));
    }

    findAll(rule = () => { return true; }) {
        return this.slots.map(rule)
            .map((val, ind) => { return val ? Grid.matrixIndex(this.columns, ind) : Null; })
            .filter(val => !!val);
    }

    getCell(cell, validated = false) {
        return validated ?
            this.slots[Grid.flatIndex(this.columns, cell)] :
            this.validateCell(cell, this.getCell);
    }

    fillCell(cell, obj, validated = false) {
        return validated ?
            (this.slots[Grid.flatIndex(this.columns, cell)] = obj) && this.getCell(cell) :
            this.validateCell(cell, this.fillCell, [obj]);
    }

    getRow(row_num, validated = false) {
        return validated ?
            [...this.slots.slice(row_num * this.columns, row_num * this.columns + this.columns)] :
            this.validateIndex(row_num, this.rows, this.getRow);
    }

    getColumn(col_num, validated = false) {
        return validated ?
            this.slots.filter((_, ind) => { return ind % this.columns === col_num; }) :
            this.validateIndex(col_num, this.columns, this.getColumn);
    }

    getMany(fn, num) {
        return [...new Array(num).fill('*')].map((_, ind) => { return fn.call(this, ind); });
    }

    windowSearch(width, height, searchFn, validated = false) {
        if (validated) {
            let res = [];

            let max_horizontal = this.columns - width;
            let max_vertical = this.rows - height;

            this.findAll()
                // .filter(cell => { return this.isValidCell(cell.neighbor(height, width)); })
                .filter(cell => { return cell.row <= max_vertical && cell.column <= max_horizontal })
                .forEach(anchor => {
                    let search_window = new Grid(height, width);

                    search_window.findAll().forEach(cell => {
                        const source = new Cell(anchor.row + cell.row, anchor.column + cell.column);
                        search_window.fillCell(cell, this.getCell(source));
                    });

                    // console.table(search_window.allRows.map(row => {
                    //     return row.map(candy => candy.color);
                    // }));
                    res.push(searchFn(search_window));

                })

            // console.log(res.length)

            return res;
        }

        return Grid.validateRowCol(width, height, 'window', this.windowSearch, [width, height, searchFn], this);
    }

    get allRows() {
        return this.getMany(this.getRow, this.rows);
    }

    get allColumns() {
        return this.getMany(this.getColumn, this.columns);
    }

    get dimension() {
        return `${this.rows} by ${this.columns}`;
    }

    get size() {
        return this.rows * this.columns;
    }

    get grid() {
        return this.allRows.map(row => { return `${row}\n`; }).toString();
    }

    get pretty_grid() {
        const cell_width = this.slots.reduce((a, b) => { return Math.max(a.toString().length, b.toString().length); }) + 5;
        let pretty_grid = '';

        const horizontal_border = '*'.repeat((cell_width + 2) * this.columns + 2);
        const row_separator = '-'.repeat(horizontal_border.length);
        const vertical_border = '|';
        const newl = '\n';
        const padding = ' ';

        const centre = (str) => {
            const ws = (cell_width - str.length);
            const [left, right] = [Math.ceil(ws / 2), Math.floor(ws / 2)];
            return padding.repeat(left) + str + padding.repeat(right);
        };

        const addBoarder = (str) => { return vertical_border + str + vertical_border; };

        pretty_grid += horizontal_border + newl;

        this.allRows.forEach((row, ind, arr) => {
            pretty_grid += vertical_border;

            row.forEach(val => {
                pretty_grid += addBoarder(centre(val.toString()));
            });

            pretty_grid += vertical_border + newl;

            if (ind < arr.length - 1) {
                pretty_grid += row_separator + newl;
            }
        }
        );

        pretty_grid += horizontal_border + newl;
        return pretty_grid;
    }

    toString() {
        return `${this.dimension} Grid`;
    }
}

class Candy {
    constructor(id, color) {

        Object.defineProperty(this, 'id', {
            value: id,
            writable: false,
        });

        Object.defineProperty(this, 'color', {
            value: color,
            writable: false,
        });

        this.row = null;
        this.column = null;
    }

    set position(cell) {
        this.row = cell.row;
        this.column = cell.column;
    }

    get position() {
        return new Cell(this.row, this.column);
    }

    setPosition(row, column) {
        this.position = new Cell(row, column);
    }

    getPosition() {
        return this.position;
    }

    toString() {
        return `${this.color} candy`;
    }

    get fullInfo() {
        return `#${this.id} ${this.color} candy at ${this.position.toString()}`;
    }

    get clone() {
        const candyClone = new Candy(this.id, this.color);
        candyClone.position = this.position;
        return candyClone;
    }

    static sameColor(...candies) {
        return candies.every((candy, _, arr) => {
            return candy ? candy.color === arr[0].color : false ;
        })  
    }
}

class Board extends Grid {
    constructor(size) {
        super(size, size);
        this.candies = 0;
        this.colors = ["red", "yellow", "green", "orange", "blue", "purple"];
        this.score = 0;
        this.event_target = new EventTarget();
    }

    isValidLocation(row, col) {
        return super.isValidCell(new Cell(row, col));
    }

    isEmptyLocation(row, col) {
        return super.isEmptyCell(new Cell(row, col));
    }

    get clone() {
        let b = new Board(this.boardSize);
        this.allRows.forEach((row, row_num) => {
            row.forEach(candy, column_number => {
                if (!!cell) return;
                b.fillCell(new Cell(row_num, column_num), candy.clone);
            })
        });
        return b;
    }

    get valid_colors() {
        return this.colors;
    }

    get valid_directions() {
        return ['up', 'down', 'left', 'right'];
    }

    get boardSize() {
        return this.rows;
    }

    get eventTarget() {
        return this.event_target;
    }

    set eventTarget(target) {
        this.event_target = target;
    }

    getSize() {
        return this.boardSize;
    }

    getCandyAt(row, col) {
        return super.getCell(new Cell(row, col));
    }

    getLocationOf(candy) {
        const location = super.find((candy_on_board) => { return candy_on_board ? candy_on_board.id === candy.id : null; })
        const onBoard = (cell) => { return cell.row > -1 && cell.column > -1; };

        return onBoard(location) ? location : null;
    }

    getAllCandies() {
        return this.slots;
    }

    isEmptyAndValid(cell) {
        return super.isValidCell(cell) && super.isEmptyCell(cell);
    }

    updateAddCandy(candy, cell) {
        candy.position = cell;
        super.fillCell(cell, candy);
    }

    add(candy, row, col, spawnRow = null, spawnCol = null) {
        const location = new Cell(row, col);
        const valid = this.isEmptyAndValid(location) && !this.getLocationOf(candy);
        if (valid) {
            this.updateAddCandy(candy, location);
            const event = new CustomEvent('add', {
                detail: {
                    candy: candy,
                    row: row,
                    col: col,
                    spawnRow: spawnRow,
                    spawnCol: spawnCol
                }
            });

            this.eventTarget.dispatchEvent(event);
        }
    }

    moveTo(candy, toRow, toCol) {
        const origin = candy.position;
        const destination = new Cell(toRow, toCol);
        const valid = !!this.getLocationOf(candy) && this.isEmptyAndValid(destination);
        if (valid) {
            this.updateAddCandy(candy, destination);
            super.fillCell(origin, null);
            const event = new CustomEvent('move', {
                detail: {
                    candy: candy,
                    toRow: candy.position.row,
                    fromRow: origin.row,
                    toCol: candy.position.column,
                    fromCol: origin.column
                }
            });

            this.eventTarget.dispatchEvent(event);
        } else {
            console.error(!!this.getLocationOf(candy), this.isEmptyAndValid(destination));
            throw Error(`invalid move operation`);
        }
    }

    remove(candy) {
        const valid = !!this.getLocationOf(candy);
        if (valid) {
            super.fillCell(candy.position, null);
            const event = new CustomEvent('remove', {
                detail: {
                    candy: candy,
                    fromRow: candy.row,
                    fromCol: candy.column
                }
            });

            this.eventTarget.dispatchEvent(event);
        }
    }

    removeAt(row, col) {
        const location = new Cell(row, col);
        const valid = super.isValidCell(location);
        if (valid) {
            const candy = super.getCell(location);
            super.fillCell(candy.position, null);
            const event = new CustomEvent('remove', {
                detail: {
                    candy: candy,
                    fromRow: candy.row,
                    fromCol: candy.column
                }
            });

            this.eventTarget.dispatchEvent(event);
        }

    }

    clear() {
        this.slots = new Array(this.size * this.size).fill(null);
    }

    addCandy(color, row, col, spawnRow = null, spawnCol = null) {
        this.add(new Candy(this.candies, color), row, col, spawnRow, spawnRow);
        this.candies++;
    }

    addRandomCandy(row, col, spawnRow, spawnCol) {
        const pickRandom = (arr) => { return arr[Math.floor(Math.random() * arr.length)]; };
        this.addCandy(pickRandom(this.colors), row, col, spawnRow, spawnCol);
    }

    addRandomCandyCell(cell) {
        this.addRandomCandy(cell.row, cell.column);
    }

    getNeighborPosition(position, direction) {
        let delta = [0, 0];
        switch (direction) {
            case 'up': delta = [-1, 0]; break;
            case 'down': delta = [1, 0]; break;
            case 'left': delta = [0, -1]; break;
            case 'right': delta = [0, 1]; break;

            default: throw Error(`Expected up, down, left, right; got ${direction}`);
        }
        return position.neighbor(...delta);
    }

    getCandyInDirection(fromCandy, direction) {
        return this.getCandyAt(...this.getNeighborPosition(fromCandy.position, direction).toArray());
    }

    moveToCell(candy, cell) {
        this.moveTo(candy, cell.row, cell.column);
    }

    flipCandies(candy1, candy2) {
        const [pos1initial, pos2initial] = [candy1.position, candy2.position];
        const candy2_clone = candy2.clone;

        this.remove(candy2);
        this.moveToCell(candy1, pos2initial);
        
        this.updateAddCandy(candy2_clone, pos1initial);
    }

    get current_score() {
        return this.score;
    }

    set current_score(new_score) {
        this.score = new_score;
    }

    resetScore() {
        const event = new CustomEvent('scoreUpdate', {
            detail: {
                prev_score: this.current_score,
                new_score: 0
            }
        });
        this.current_score = 0;
        this.eventTarget.dispatchEvent(event);

    }

    incrementScore(candy, row, col) {
        const INC = 0;
        const event = new CustomEvent('scoreUpdate', {
            detail: {
                prev_score: this.current_score,
                new_score: this.current_score + INC,
                candy: candy,
                row: row,
                col: col
            }
        });
        this.current_score = this.current_score + INC;
        this.eventTarget.dispatchEvent(event);

    }

    getScore() {
        return this.current_score;
    }

    toString() {
        console.table(this.allRows);
        return this.grid;
    }

    toArray() {
        return [...this.slots];
    }
}

class Game {
    constructor() {
        this.board = new Board(15);
        this.scoring = false;
    }

    makeMove(fromCandy, direction) {
        const valid = this.isMoveValidType(fromCandy, direction);

        if (valid) {
            this.board.flipCandies(fromCandy, this.board.getCandyInDirection(fromCandy, direction));
        }
    }

    set dimensions(width) {
        this.board = new Board(width);
    }

    /*
    *
    *   Returns true if flipping fromCandy with the candy in the direction
    *   specified (["up", "down", "left", "right"]) is valid
    *   (according to the rules), else returns false.
    *
    */
    isMoveValidType(fromCandy, direction) {
        return this.numberCandiesCrushedByMove(fromCandy, direction) > 0;
    }

    /*
    *   Returns a list of all candy crushes on the board. A crush is a list of three
    *   candies in a single row or column that have the same color. Each crush is returned 
    *   as a list of lists
    */
    getCandyCrushes() {
        return ['allRows', 'allColumns'].map(group => {
            return this.board[group].map(line => {
                return LongestSequences(line, 3, Candy.sameColor);
            });
        });
    }

    /* 
    *   Deletes all candies in listOfListsOfCrushes. If the game has already began, incremements 
    *   the board score. Does not move the candies down at all. 
    */
    removeCrushes(listOfCrushes = []) {
        Array.from
            (
            new Set(listOfCrushes.flat())
            )
            .forEach(candy => this.board.remove(candy));
    }


    /* 
    *   Moves candies down as far as there are spaces. Issues calls to Board.moveTo which generates move 
    *   events. If there are holes created by moving the candies down, populates the board with new random candies
    */
    moveCandiesDown() {
        this.board.allColumns.forEach((column, column_number) => {
            const emptyCellsBelow = (row_number) => {
                return column
                    .map((_, idx) => new Cell(idx, column_number))
                    .slice(row_number)
                    .filter(cell => this.board.isEmptyCell(cell), this);
            };

            const newLocation = (candy) => {
                return new Cell(
                    candy.position.row + emptyCellsBelow(candy.position.row).length,
                    candy.position.column
                );
            };

            column.slice(0).reverse().forEach(candy => {
                if (!candy) return;

                if (emptyCellsBelow(candy.position.row).length > 0) {
                    this.board.moveToCell(candy, newLocation(candy));
                }
            });

            emptyCellsBelow(0).reverse().forEach(empty_cell => {
                this.board.addRandomCandyCell(empty_cell);
            });
        });

    }

    getAllValidMoves() {
        const v_pattern_down = {
            getPattern: (anchor) => {
                return [
                    anchor,
                    anchor.neighbor(1, 1),
                    anchor.neighbor(0, 2)
                ];
            },
            validAnchor: (board, anchor) => {
                return anchor.row < board.rows - 2 && anchor.column < board.columns - 3;
            },
            width: 3,
            height: 2,
            getMove: (anchor) => {
                return {
                    candy_position: anchor.neighbor(1, 1),
                    direction: 'up'
                };
            }
        };

        const v_pattern_left = {
            getPattern: (anchor) => {
                return [
                    anchor,
                    anchor.neighbor(1, -1),
                    anchor.neighbor(2, 0)
                ];
            },
            validAnchor: (board, anchor) => {
                return anchor.row < board.rows - 3 && anchor.column > 0;
            },
            width: 2,
            height: 3,
            getMove: (anchor) => {
                return {
                    candy_position: anchor.neighbor(1, -1),
                    direction: 'right'
                };
            }
        };

        const v_pattern_right = {
            getPattern: (anchor) => {
                return [
                    anchor,
                    anchor.neighbor(1, 1),
                    anchor.neighbor(2, 0)
                ];
            },
            validAnchor: (board, anchor) => {
                return anchor.row < board.rows - 3 && anchor.column < board.columns - 2;
            },
            width: 2,
            height: 3,
            getMove: (anchor) => {
                return {
                    candy_position: anchor.neighbor(1, 1),
                    direction: 'left'
                };
            }
        };

        const v_pattern_up = {
            getPattern: (anchor) => {
                return [
                    anchor,
                    anchor.neighbor(-1, 1),
                    anchor.neighbor(0, 2)
                ];
            },
            validAnchor: (board, anchor) => {
                return anchor.row > 0 && anchor.column < board.columns - 3;
            },
            width: 3,
            height: 2,
            getMove: (anchor) => {
                return {
                    candy_position: anchor.neighbor(-1, 1),
                    direction: 'down'
                };
            }
        };

        const flat_pattern = {
            getPattern: (anchor) => {
                return [
                    anchor,
                    anchor.neighbor(0, 1),
                    anchor.neighbor(0, 3)
                ];
            },
            validAnchor: (board, anchor) => {
                return anchor.column < board.columns - 4;
            },
            width: 4,
            height: 1,
            getMove: (anchor) => {
                return {
                    candy_position: anchor.neighbor(0, 3),
                    direction: 'up'
                };
            }
        };

        const l_pattern = {
            getPattern: (anchor) => {
                return [
                    anchor,
                    anchor.neighbor(0, 1),
                    anchor.neighbor(1, 2)
                ];
            },
            validAnchor: (board, anchor) => {
                return anchor.row < board.rows - 2 && anchor.column < board.columns - 4;
            },
            width: 4,
            height: 2,
            getMove: (anchor) => {
                return {
                    candy_position: anchor.neighbor(1, 2),
                    direction: 'up'
                };
            }
        };

        const fill_candy = (move) => {
            return {
                candy: this.board.getCell(move.candy_position),
                direction: move.direction
            }
        };



        return [v_pattern_down, v_pattern_up, v_pattern_left, v_pattern_right, flat_pattern, l_pattern].map(blueprint => {
            return this.board
                .findAll()
                .filter(cell => { return blueprint.validAnchor(this.board, cell); })
                .map(blueprint.getPattern)
                .map(pattern => { return pattern.map(cell => { return this.board.getCell(cell); }); })
                .filter(pattern => Candy.sameColor(...pattern.flat()))
                .map(pattern => pattern[0].position)
                .map(blueprint.getMove)
                .map(fill_candy);
        });

    }

    /* 
    *   If there is a valid move on the board, returns an object with two properties: candy: a candy that can be moved 
    *   and direction: the direction to be moved. If there are no valid moves, returns null. The move is selected 
    *   randomly from available moves. 
    */
    getRandomValidMove() {
        const pickRandom = (arr) => { return arr[Math.floor(Math.random() * arr.length)]; };
        return pickRandom(this.getAllValidMoves().flat());
    }


    /* 
    *   Populates the board with random candies
    */
    populateBoard() {
        this.board.findAll().forEach(cell => this.board.addRandomCandyCell(cell));
    }

    /*
    *   Returns a list of candies that would be crushed if fromCandy were to be moved in the direction
    *   specified by direction. If no candies are to be crushed, returns an empty list.  
    */
    getCandiesToCrushGivenMove(fromCandy, direction) {
        const destination = this.board.getNeighborPosition(fromCandy.position, direction);
        const valid = this.board.isValidCell(destination);

        const flip = (arr1, arr2, position) => {
            return [
                arr1.slice(0, position) + [arr2[position]] + arr1.slice(position + 1),
                arr2.slice(0, position) + [arr1[position]] + arr2.slice(position + 1)
            ];
        }

        if (valid) {
            if (destination.row === fromCandy.position.row) {

                return Array.from(
                    new Set(
                        [
                            ...flip(this.board.getColumn(destination.column), this.board.getColumn(fromCandy.position.column), destination.row),
                            this.board.getRow(destination.row)
                        ]
                            .map(line => { return LongestSequences(line, 3, Candy.sameColor); })
                            .flat(3)
                    )
                );

            } else {

                return Array.from(
                    new Set(
                        [
                            ...flip(this.board.getRow(destination.row), this.board.getRow(fromCandy.position.row), destination.column),
                            this.board.getColumn(destination.column)
                        ]
                            .map(line => { return LongestSequences(line, 3, Candy.sameColor); })
                            .flat(3)
                    )
                );

            }
        }

        return [];
    }

    /*
    *   Returns number of sets of candies that would be crushed if the candy was moved in the specified
    *   direction
    */
    numberCandiesCrushedByMove(fromCandy, direction) {
        return this.getCandiesToCrushGivenMove(fromCandy, direction).length;
    }


    /*
    *   prepares new game with no sets of crushable candies. Sets the score to zero so that player doesn't 
    *   get crushes by luck 
    */
    prepareNewGame() {
        this.populateBoard();
        let crushes = this.getCandyCrushes().flat(2);
        while (crushes.length > 0) {
            this.removeCrushes(crushes);
            this.moveCandiesDown();
            crushes = this.getCandyCrushes().flat(2);
        }
    }
}

