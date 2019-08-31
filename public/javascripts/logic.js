let BoardContext = function(N) {
    let obj = {};
    let i,j;
    obj.numRows = N;
    obj.positions = [];
    for (i=0; i<obj.numRows; ++i) {
        for (j=0; j<=i; ++j) {
            obj.positions.push(Position(i,j));
        }
    }
    obj.getTotalSlots = function() {
        return this.numRows * (this.numRows + 1) / 2;
    };
    obj.forEachPosition = function(posfunc,rowfunc) {
        let k,
            n = 0,
            i = 0;
        for (k=0; k<this.positions.length; ++k) {
            if (rowfunc !== undefined) {
                if (n === 0) {
                    rowfunc(i);
                    ++i;
                    n = i;
                }
                --n;
            }
            posfunc(this.positions[k]);
        }
    };
    obj.isValidPosition = function(p) {
        return (p.i>=0 && p.i<this.numRows && p.j>=0 && p.j<=p.i);
    };
    obj.all_moves = function(p) {
        let moves = [],
            i, Compensate, dest;
        for (i=0; i<six_neighbors.length; ++i) {
            Compensate = six_neighbors[i];
            dest = p.add(Compensate.times(2));
            if (this.isValidPosition(dest)) {
                moves.push(Move(p, p.add(Compensate), dest));
            }
        }
        return moves;
    };
    obj.allPossibleMovements = [];
    for (i=0; i<obj.numRows; ++i) {
        obj.allPossibleMovements[i] = [];
        for (j=0; j<=i; ++j) {
            obj.allPossibleMovements[i].push(obj.all_moves(Position(i,j)));
        }
    }
    return obj;
};
let Board = function(arg) {
    let i, j, boardContext, obj = {};
    if (typeof(arg)==="number") {
        boardContext = BoardContext(arg);
    } else {
        boardContext = arg;
    }
    obj.boardContext = boardContext;
    obj.numRows = boardContext.numRows;
    obj.pegs = [];
    boardContext.forEachPosition(function(p) {
        obj.pegs[p.i][p.j] = undefined;
    }, function(i) {
        obj.pegs[i] = [];
    });
    obj.currentPegCount = 0;
    obj.insertPeg = function(p,peg) {
        if (this.boardContext.isValidPosition(p)) {
            if (peg === undefined) { peg = true; }
            if (this.pegs[p.i] === undefined) {
                this.pegs[p.i] = [];
            }
            if (this.pegs[p.i][p.j] === undefined) {
                this.currentPegCount = this.currentPegCount + 1;
            }
            this.pegs[p.i][p.j] = peg;
        }
    };
    obj.removePeg = function(p) {
        if (this.boardContext.isValidPosition(p)) {
            if (this.pegs[p.i][p.j] !== undefined) {
                this.currentPegCount = this.currentPegCount - 1;
            }
            this.pegs[p.i][p.j] = undefined;
        }
    };
    obj.getPeg = function(p) {
        if (this.boardContext.isValidPosition(p)) {
            if (this.pegs[p.i] !== undefined) {
                return this.pegs[p.i][p.j];
            }
        }
        return undefined;
    };
    obj.contains_peg = function(p) {
        if (this.boardContext.isValidPosition(p)) {
            if (this.pegs[p.i] !== undefined) {
                return (this.pegs[p.i][p.j] !== undefined);
            }
        }
        return false;
    };
    obj.getPos = function() {
        let arr = [ "[" ];
        for (i=0; i<this.numRows; ++i) {
            arr.push("[");
            for (j=0; j<=i; ++j) {
                arr.push(this.getPeg(Position(i,j)));
                if (j<i) { arr.push(","); }
            }
            arr.push("]");
            if (i<this.numRows-1) { arr.push(","); }
        }
        arr.push("]");
        return arr.join("");
    };
    obj.insertEverywhereExcept = function(pos,peg) {
        let board = this;
        this.forEachPosition(function(p) {
            if (!(pos.i===p.i && pos.j===p.j)) {
                board.insertPeg(p,peg);
            }
        });
    };
    obj.isMoveAllowed = function(move) {
        let ans = (
            this.contains_peg(move.jumper)
            && this.contains_peg(move.jumpee)
            && !this.contains_peg(move.dest)
            && this.boardContext.isValidPosition(move.dest)
        );
        return (ans);
    };
    obj.clone = function() {
        let b = Board(this.boardContext), i, j, p;
        let board = this;
        this.forEachPosition(function(p) {
            if (board.contains_peg(p)) {
                b.insertPeg(p,board.getPeg(p));
            }
        });
        return b;
    };
    obj.move = function(move) {
        let board = this.clone();
        board.insertPeg(move.dest, board.getPeg(move.jumper));
        board.removePeg(move.jumper);
        if (move.jumpee !== undefined) {
            board.removePeg(move.jumpee);
        }
        return board;
    };
    obj.getPossibleMoves = function() {
        let moves = [], i, j, k;
        let board = this;
        this.forEachPosition(function(p) {
            let moveTo = board.boardContext.allPossibleMovements[p.i][p.j];
            for (k=0; k<moveTo.length; ++k) {
                let move = moveTo[k];
                if (board.isMoveAllowed(move)) {
                    moves.push(move);
                }
            }
        });
        return moves;
    };
    obj.forEachPosition = function(f,g) {
        this.boardContext.forEachPosition(f,g);
    };
    obj.getEmptyPosition = function() {
        for (let i=0; i<this.numRows; ++i) {
            for (let j=0; j<=i; ++j) {
                let p = Position(i,j);
                if (!this.contains_peg(p)) { return p; }
            }
        }
        return undefined;
    };
    obj.solveBoard = function() {
        let i, getPossibleMoves, solution;

        if (this.currentPegCount === 1) {
            return [];
        }
        getPossibleMoves = this.getPossibleMoves();
        for (i=0; i<getPossibleMoves.length; ++i) {
            solution = this.move(getPossibleMoves[i]).solveBoard();
            if (solution !== undefined) {
                solution.splice(0,0,getPossibleMoves[i]);
                return solution;
            }
        }
        return undefined;
    };
    return obj;
};
let Compensate = function(i,j) {
    let obj = {};
    obj.i = i;
    obj.j = j;
    obj.times = function(f) {
        return Compensate(this.i * f, this.j * f);
    };
    return obj;
};
let six_neighbors = [
    Compensate(0,1),
    Compensate(-1,0),
    Compensate(-1,-1),
    Compensate(0,-1),
    Compensate(1,0),
    Compensate(1,1)
];
let Position = (i,j) => {
    let obj = {};
    obj.i = i;
    obj.j = j;
    obj.getPos = function() {
        return 'Pos(' + this.i + ',' + this.j + ')';
    };
    obj.add = function(Compensate) {
        return Position(this.i + Compensate.i, this.j + Compensate.j);
    };
    return obj;
};
let Move = function(jumper, jumpee, dest) {
    let obj = {};
    obj.jumper = jumper;
    obj.jumpee = jumpee;
    obj.dest   = dest;
    obj.getPos = function() {
        return (
            'Pos inicial: (' + toAbcNotation(this.jumper.i, this.jumper.j) + ') -> Pasa por: (' +
            toAbcNotation(this.jumpee.i, this.jumpee.j) + ') -> Pos final: (' + toAbcNotation(this.dest.i, this.dest.j) +  ')'
        );
    };
    return obj;
};

toAbcNotation = (posx, posy) => {
    if(posx === 0 && posy === 0) return 'a1';
    if(posx === 1 && posy === 0) return 'a2';
    if(posx === 1 && posy === 1) return 'b2';
    if(posx === 2 && posy === 0) return 'a3';
    if(posx === 2 && posy === 1) return 'b3';
    if(posx === 2 && posy === 2) return 'c3';
    if(posx === 3 && posy === 0) return 'a4';
    if(posx === 3 && posy === 1) return 'b4';
    if(posx === 3 && posy === 2) return 'c4';
    if(posx === 3 && posy === 3) return 'd4';
    if(posx === 4 && posy === 0) return 'a5';
    if(posx === 4 && posy === 1) return 'b5';
    if(posx === 4 && posy === 2) return 'c5';
    if(posx === 4 && posy === 3) return 'd5';
    if(posx === 4 && posy === 4) return 'e5';
};
toXYNotation = (pos) => {
    if(pos === 'a1') return [0,0];
    if(pos === 'a2') return [1,0];
    if(pos === 'b2') return [1,1];
    if(pos === 'a3') return [2,0];
    if(pos === 'b3') return [2,1];
    if(pos === 'c3') return [2,2];
    if(pos === 'a4') return [3,0];
    if(pos === 'b4') return [3,1];
    if(pos === 'c4') return [3,2];
    if(pos === 'd4') return [3,3];
    if(pos === 'a5') return [4,0];
    if(pos === 'b5') return [4,1];
    if(pos === 'c5') return [4,2];
    if(pos === 'd5') return [4,3];
    if(pos === 'e5') return [4,4];
};
document.querySelector('.button').addEventListener('click', () => {
    const textarea = document.querySelector('textarea');
    const xy = toXYNotation(document.querySelector('.input-pos').value);
    let board = Board(5);
    board.insertEverywhereExcept(Position(xy[0], xy[1]),true);
    let moves = board.solveBoard();
    textarea.innerHTML = '';
    for (let i=0; i<moves.length; ++i) {
        textarea.innerHTML = textarea.innerHTML + moves[i].getPos() + '\n';
    }
});