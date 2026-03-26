const boardElement = document.getElementById("sudoku-board");
const statusElement = document.getElementById("status");
const generateButton = document.getElementById("generate-button");
const clearButton = document.getElementById("clear-button");

let currentPuzzle = [];
let currentSolution = [];

function shuffle(array) {
  const copy = [...array];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function isValidPlacement(grid, row, column, value) {
  for (let index = 0; index < 9; index += 1) {
    if (grid[row][index] === value || grid[index][column] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;

  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
      if (grid[boxRow + rowOffset][boxColumn + columnOffset] === value) {
        return false;
      }
    }
  }

  return true;
}

function fillGrid(grid) {
  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      if (grid[row][column] !== 0) {
        continue;
      }

      for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (!isValidPlacement(grid, row, column, value)) {
          continue;
        }

        grid[row][column] = value;

        if (fillGrid(grid)) {
          return true;
        }

        grid[row][column] = 0;
      }

      return false;
    }
  }

  return true;
}

function buildSolvedGrid() {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(grid);
  return grid;
}

function makePuzzle(solutionGrid, clues = 36) {
  const puzzle = solutionGrid.map((row) => [...row]);
  const positions = [];

  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      positions.push([row, column]);
    }
  }

  const cellsToRemove = 81 - clues;

  for (const [row, column] of shuffle(positions).slice(0, cellsToRemove)) {
    puzzle[row][column] = 0;
  }

  return puzzle;
}

function updateBoardState() {
  let filledCount = 0;
  let hasError = false;
  let isSolved = true;

  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      if (currentPuzzle[row][column] !== 0) {
        continue;
      }

      const input = boardElement.querySelector(
        `[data-row="${row}"][data-column="${column}"]`
      );
      const cell = input.closest(".cell");
      const value = Number(input.value || 0);

      cell.classList.remove("user-filled", "has-error", "is-correct");

      if (value === 0) {
        isSolved = false;
        continue;
      }

      filledCount += 1;
      cell.classList.add("user-filled");

      if (value !== currentSolution[row][column]) {
        cell.classList.add("has-error");
        hasError = true;
        isSolved = false;
        continue;
      }

      cell.classList.add("is-correct");
    }
  }

  if (isSolved) {
    statusElement.textContent = "You solved it! Every number is correct.";
    return;
  }

  if (hasError) {
    statusElement.textContent = "A few entries are off.";
    return;
  }

  statusElement.textContent = filledCount === 0
    ? "Puzzle ready. Fill in the blank squares with digits 1 to 9."
    : "Nice progress. Keep going!";
}

function renderBoard(grid) {
  boardElement.innerHTML = "";

  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      const cell = document.createElement("div");
      const value = grid[row][column];

      cell.className = "cell";

      if (value !== 0) {
        cell.textContent = value;
        cell.classList.add("clue");
      } else {
        const input = document.createElement("input");
        input.className = "cell-input";
        input.type = "text";
        input.inputMode = "numeric";
        input.maxLength = 1;
        input.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}`);
        input.dataset.row = String(row);
        input.dataset.column = String(column);

        input.addEventListener("input", (event) => {
          const sanitizedValue = event.target.value.replace(/[^1-9]/g, "").slice(0, 1);
          event.target.value = sanitizedValue;
          updateBoardState();
        });

        input.addEventListener("keydown", (event) => {
          if (event.key === "Backspace" || event.key === "Delete" || event.key === "Tab") {
            return;
          }

          if (event.key.length === 1 && !/[1-9]/.test(event.key)) {
            event.preventDefault();
          }
        });

        cell.classList.add("input-cell");
        cell.appendChild(input);
      }

      if (column === 2 || column === 5) {
        cell.classList.add("border-right");
      }

      if (row === 2 || row === 5) {
        cell.classList.add("border-bottom");
      }

      boardElement.appendChild(cell);
    }
  }
}

function generatePuzzle() {
  statusElement.textContent = "Generating a new Sudoku...";
  generateButton.disabled = true;
  clearButton.disabled = true;

  window.requestAnimationFrame(() => {
    currentSolution = buildSolvedGrid();
    currentPuzzle = makePuzzle(currentSolution);

    renderBoard(currentPuzzle);
    updateBoardState();
    generateButton.disabled = false;
    clearButton.disabled = false;
  });
}

function clearEntries() {
  const inputs = boardElement.querySelectorAll(".cell-input");

  inputs.forEach((input) => {
    input.value = "";
  });

  updateBoardState();
}

generateButton.addEventListener("click", generatePuzzle);
clearButton.addEventListener("click", clearEntries);

generatePuzzle();
