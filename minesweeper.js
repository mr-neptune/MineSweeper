document.addEventListener('DOMContentLoaded', () => {
    initializeGameBoard(10, 15, 1); // 10*15 grid
});

let gameState = {
    rows: 0,
    cols: 0,
    n: 0,
    count1: 0, // Correctly flagged mines
    count2: 0, // Revealed non-mine cells
};

// initialize the game board
function initializeGameBoard(rows, cols, numberOfMines) {
    gameState.rows = rows;
    gameState.cols = cols;
    gameState.n = numberOfMines;
    gameState.count1 = 0;
    gameState.count2 = 0;

    const grid = document.getElementById('gameBoard');
    // clear the grid if you want to reinitialize it
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cols}, 35px)`; // Set the number of columns based on the grid size


    // generate a map marking the position of mines
    const minePositions = generateMinePositions(rows, cols, numberOfMines);

    for (let i = 0; i < rows * cols; i++) {
        let cell = document.createElement('div');
        cell.classList.add('cell');
        
        // add the row and col # of each cell as a data attributes to that cell
        const row = Math.floor(i / cols);  // in the range of [0, row - 1]
        const col = i % cols;              // in the range of [0, col - 1]
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.revealed = 'false';

        // Use a boolean to indicate if the cell is a mine
        const isMine = minePositions.has(`${row},${col}`);
        cell.dataset.isMine = isMine; // Store the state directly in the cell's dataset

        cell.addEventListener('click', function() {
            handleCellClick(cell, minePositions, rows, cols);
        });

        cell.addEventListener('contextmenu', function(event) {
            event.preventDefault(); // Prevent the context menu from showing
            handleRightClick(cell);
        });

        grid.appendChild(cell);
    }
}

// generate mines in random position when initializing the game board
function generateMinePositions(rows, cols, numberOfMines) {
    let positions = new Set();

    while (positions.size < numberOfMines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        positions.add(`${row},${col}`); // Use a string like "row,col" to represent the position
    }

    return positions;
}


// handles left click
function handleCellClick(cell, minePositions, rows, cols) {
    if (cell.dataset.isMine === 'true') {
        // If the cell is a mine
        gameOver(minePositions, rows, cols);
    } else {
        // If the cell is not a mine, reveal surrounding mines count or expand
        revealCell(cell, rows, cols, minePositions);
    }
}

// handles right click
function handleRightClick(cell) {
    if (cell.dataset.flagged === 'true') {
        cell.dataset.flagged = 'false';
        cell.style.backgroundColor = '';        // reset the cell to the original color specified in CSS file
        if (cell.dataset.isMine === 'true') {
            gameState.count1--;    // # of flagged mines decreases by 1
        }
    } else {
        cell.dataset.flagged = 'true';
        cell.style.backgroundColor = 'yellow';  // change the color to yellow
        if (cell.dataset.isMine === 'true') {
            gameState.count1++;    // # of flagged mines increases by 1
        }
    }
    checkWinCondition();
}



function gameOver(minePositions, rows, cols) {
    // Reveal all cells
    document.querySelectorAll('.cell').forEach(cell => {
        const isMine = cell.dataset.isMine === 'true';
        cell.style.backgroundColor = isMine ? 'red' : 'white';
        if (!isMine) {
            // Optionally, calculate and display the number of surrounding mines
            const count = getSurroundingMineCount(cell, minePositions);
            cell.textContent = count > 0 ? count : '';
        }
    });

    // Show game over message after 3 seconds
    setTimeout(() => showEndGameMessage(false), 1000);
}

function checkWinCondition() {
    if (gameState.count1 === gameState.n && gameState.count2 === gameState.rows * gameState.cols - gameState.n) {
        setTimeout(() => showEndGameMessage(true), 1000);
    }
    
}


function getSurroundingMineCount(cell, minePositions) {
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);
    let mineCount = 0;

    // Define the relative positions of all possible neighboring cells
    const neighbors = [
        [-1, -1], [-1, 0], [-1, 1], // Above
        [0, -1],           [0, 1],  // Sides
        [1, -1], [1, 0], [1, 1]    // Below
    ];

    neighbors.forEach(offset => {
        const neighborRow = row + offset[0];
        const neighborCol = col + offset[1];
        const key = `${neighborRow},${neighborCol}`;

        if (minePositions.has(key)) {
            mineCount++;
        }
    });

    return mineCount;
}



function revealCell(cell, rows, cols, minePositions) {
    // Check if the cell has already been revealed to prevent unnecessary work
    if (cell.dataset.revealed === 'true') {
        return;
    }

    // Mark the cell as revealed
    cell.dataset.revealed = 'true';
    gameState.count2++;  // # of cells revealed increases by 1
    checkWinCondition();

    // Calculate the number of surrounding mines
    const mineCount = getSurroundingMineCount(cell, minePositions);
    // Change the background color of revealed cells to white
    cell.style.backgroundColor = 'white';


    if (mineCount > 0) {
        // If there are mines around, show the count and adjust styling as needed
        cell.textContent = mineCount;
    } else {
        // If there are no surrounding mines, proceed to reveal surrounding cells
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        const neighborOffsets = [
            [-1, -1], [-1, 0], [-1, 1], // above
            [0, -1],           [0, 1],  // side
            [1, -1], [1, 0], [1, 1]     // below
        ];

        neighborOffsets.forEach(offset => {
            const neighborRow = row + offset[0];
            const neighborCol = col + offset[1];
            // Ensure we only try to reveal cells within the grid boundaries
            if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                const neighborCell = document.querySelector(`.cell[data-row="${neighborRow}"][data-col="${neighborCol}"]`);
                if (neighborCell && neighborCell.dataset.revealed !== 'true') {
                    revealCell(neighborCell, rows, cols, minePositions);
                }
            }
        });
    }
}

function showEndGameMessage(win) {
    const messageText = win ? "You win, congratulations!" : "You lose.";

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    document.body.appendChild(messageContainer);

    const message = document.createElement('div');
    message.id = 'winMessage';
    message.textContent = messageText;
    messageContainer.appendChild(message);

    // Add difficulty buttons
    const difficulties = [
        { label: 'Easy', rows: 10, cols: 15, mines: 10 },
        { label: 'Medium', rows: 15, cols: 20, mines: 40 },
        { label: 'Hard', rows: 15, cols: 25, mines: 50 }
    ];

    difficulties.forEach(diff => {
        const button = document.createElement('button');
        button.textContent = diff.label;
        button.className = 'button-style';
        button.onclick = () => {
            initializeGameBoard(diff.rows, diff.cols, diff.mines);
            document.body.removeChild(messageContainer);
        };
        messageContainer.appendChild(button);
    });

    // Add home button
    const homeButton = document.createElement('button');
    homeButton.textContent = 'Home';
    homeButton.className = 'button-style';
    homeButton.onclick = () => {
        location.href = 'home.html';
    };
    messageContainer.appendChild(homeButton);
}

