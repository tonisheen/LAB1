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

