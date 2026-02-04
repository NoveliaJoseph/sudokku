/**
 * Sudoku Game with CSP Design
 * Logic based on Constraints Satisfaction Problem (Backtracking)
 */

class SudokuCSP {
    constructor() {
        this.size = 9;
        this.board = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.solution = null;
    }

    // Check if placing num at board[row][col] is valid
    isValid(board, row, col, num) {
        // Check Row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check Col
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 Box
        let startRow = row - row % 3;
        let startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }

        return true;
    }

    // Fill the diagonal 3x3 matrices first (independent of each other)
    fillDiagonal() {
        for (let i = 0; i < 9; i = i + 3) {
            this.fillBox(i, i);
        }
    }

    // Fill a 3x3 box
    fillBox(row, col) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!this.isSafeInBox(row, col, num));
                this.board[row + i][col + j] = num;
            }
        }
    }

    // Check if number is safe in 3x3 box
    isSafeInBox(rowStart, colStart, num) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[rowStart + i][colStart + j] === num) return false;
            }
        }
        return true;
    }

    // Solve the rest of the board using CSP (Backtracking)
    solveBoard(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(board, i, j, num)) {
                            board[i][j] = num;
                            if (this.solveBoard(board)) return true;
                            board[i][j] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    generateNewGame(difficulty = 'Medium') {
        // Reset
        this.board = Array.from({ length: 9 }, () => Array(9).fill(0));
        
        // 1. Fill Diagonal
        this.fillDiagonal();

        // 2. Solve to get complete valid board
        this.solveBoard(this.board);
        this.solution = this.board.map(row => [...row]); // Deep copy solution

        // 3. Remove digits based on difficulty
        let attempts = 40; // Default Medium
        if (difficulty === 'Easy') attempts = 30;
        if (difficulty === 'Hard') attempts = 50;
        
        this.removeDigits(attempts);
        return {
            initial: this.board,
            solution: this.solution
        };
    }

    removeDigits(count) {
        while (count > 0) {
            let cellId = Math.floor(Math.random() * 81);
            let i = Math.floor(cellId / 9);
            let j = cellId % 9;
            if (this.board[i][j] !== 0) {
                this.board[i][j] = 0;
                count--;
            }
        }
    }
}

/**
 * UI Controller
 */
const app = {
    csp: new SudokuCSP(),
    initialBoard: [],
    currentBoard: [],
    solutionBoard: [],
    selectedCell: null,
    timerInterval: null,
    timeElapsed: 0,
    isGameActive: false,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.startNewGame();
    },

    cacheDOM() {
        this.boardEl = document.getElementById('sudoku-board');
        this.timerEl = document.getElementById('timer');
        this.btnNewGame = document.getElementById('btn-new-game');
        this.btnCheck = document.getElementById('btn-check');
        this.numpad = document.getElementById('numpad');
        this.modal = document.getElementById('message-modal');
        this.btnModalClose = document.getElementById('btn-modal-close');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
    },

    bindEvents() {
        this.btnNewGame.addEventListener('click', () => this.startNewGame());
        this.btnCheck.addEventListener('click', () => this.checkSolution());
        this.numpad.addEventListener('click', (e) => this.handleNumpad(e));
        this.btnModalClose.addEventListener('click', () => this.closeModal());
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.isGameActive) return;
            if (e.key >= '1' && e.key <= '9') {
                this.fillCell(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.fillCell(0);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.moveSelection(e.key);
            }
        });
    },

    startNewGame() {
        const gameData = this.csp.generateNewGame();
        this.initialBoard = gameData.initial.map(row => [...row]);
        this.solutionBoard = gameData.solution;
        
        // Current board tracks user progress
        this.currentBoard = this.initialBoard.map(row => [...row]);
        
        this.renderBoard();
        this.resetTimer();
        this.startTimer();
        this.isGameActive = true;
        this.selectedCell = null;
    },

    renderBoard() {
        this.boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;

                const val = this.currentBoard[i][j];
                if (val !== 0) {
                    cell.textContent = val;
                    if (this.initialBoard[i][j] !== 0) {
                        cell.classList.add('prefilled');
                    } else {
                        cell.classList.add('user-input');
                    }
                }

                cell.addEventListener('click', () => this.selectCell(cell, i, j));
                this.boardEl.appendChild(cell);
            }
        }
    },

    selectCell(cell, row, col) {
        if (!this.isGameActive) return;

        // Clear previous selection
        document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.cell.highlight-related').forEach(el => el.classList.remove('highlight-related'));
        
        // Set new selection
        this.selectedCell = { row, col, element: cell };
        cell.classList.add('selected');

        // Highlight related (Row, Col, Box)
        this.highlightRelated(row, col);
    },

    highlightRelated(row, col) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            
            // Check same row or col
            const sameRow = r === row;
            const sameCol = c === col;
            
            // Check box
            const startRow = row - row % 3;
            const startCol = col - col % 3;
            const inBox = (r >= startRow && r < startRow + 3) && (c >= startCol && c < startCol + 3);

            if (sameRow || sameCol || inBox) {
                if (!(r === row && c === col)) {
                    cell.classList.add('highlight-related');
                }
            }
        });
    },

    moveSelection(key) {
        if (!this.selectedCell) return;
        let { row, col } = this.selectedCell;
        
        if (key === 'ArrowUp') row = Math.max(0, row - 1);
        if (key === 'ArrowDown') row = Math.min(8, row + 1);
        if (key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (key === 'ArrowRight') col = Math.min(8, col + 1);

        const index = row * 9 + col;
        const targetCell = this.boardEl.children[index];
        this.selectCell(targetCell, row, col);
    },

    handleNumpad(e) {
        if (!this.isGameActive) return;
        const target = e.target.closest('button');
        if (!target) return;

        if (target.id === 'btn-clear') {
            this.fillCell(0);
        } else {
            const val = parseInt(target.dataset.value);
            if (val) this.fillCell(val);
        }
    },

    fillCell(num) {
        if (!this.selectedCell) return;
        const { row, col, element } = this.selectedCell;

        // Prevent editing prefilled cells
        if (this.initialBoard[row][col] !== 0) return;

        // Update logic
        this.currentBoard[row][col] = num;

        // Update UI
        if (num === 0) {
            element.textContent = '';
            element.classList.remove('user-input', 'error');
        } else {
            element.textContent = num;
            element.classList.add('user-input');
            element.classList.remove('error');
            
            // Validate immediate conflict (optional UX enhancement)
            // if (!this.csp.isValid(this.currentBoard, row, col, num)) {
            //    element.classList.add('error');
            // } -- User asked for Validation on "Check Solution" but we can do instant feedback if we want.
            // Let's stick to simple input first.
            element.classList.add('success-pop');
            setTimeout(() => element.classList.remove('success-pop'), 400);
        }
    },

    checkSolution() {
        let isCorrect = true;
        let isComplete = true;

        const cells = document.querySelectorAll('.cell');
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const val = this.currentBoard[i][j];
                const solutionVal = this.solutionBoard[i][j];
                const cellIndex = i * 9 + j;
                const cellEl = cells[cellIndex];

                if (val === 0) {
                    isComplete = false;
                } else if (val !== solutionVal) {
                    isCorrect = false;
                    // Mark error
                    if (this.initialBoard[i][j] === 0) {
                        cellEl.classList.add('error');
                    }
                } else {
                    cellEl.classList.remove('error');
                }
            }
        }

        if (isComplete && isCorrect) {
            this.gameWon();
        } else if (!isCorrect) {
            // alert('Some numbers are incorrect!');
        } else {
            // alert('Board is not full!');
        }
    },

    gameWon() {
        this.isGameActive = false;
        clearInterval(this.timerInterval);
        this.showModal('Splendid!', `You solved it in ${this.formatTime(this.timeElapsed)}`);
    },

    startTimer() {
        this.timeElapsed = 0;
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.timerEl.textContent = this.formatTime(this.timeElapsed);
        }, 1000);
    },

    resetTimer() {
        clearInterval(this.timerInterval);
        this.timerEl.textContent = '00:00';
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    showModal(title, msg) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = msg;
        this.modal.classList.remove('hidden');
    },

    closeModal() {
        this.modal.classList.add('hidden');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
