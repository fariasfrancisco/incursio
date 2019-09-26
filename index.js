'use strict'

class Option {
  constructor (cell, piece) {
    this.cell = cell
    this.piece = piece
  }
}

class Player {
  constructor (turn, pieces) {
    this.turn = turn
    this.pieces = pieces
  }
}

class Cell {
  constructor (x, y) {
    this.x = x * CELL_SIZE
    this.y = y * CELL_SIZE
    this.i = x
    this.j = y
  }
}

class Piece {
  constructor (location, status, player) {
    this.location = location
    this.status = status
    this.player = player
  }
}

const boardLayer = document.getElementById('board-layer')
const highlightLayer = document.getElementById('highlight-layer')
const piecesLayer = document.getElementById('pieces-layer')
const boardContext = boardLayer.getContext('2d')
const highlightContext = highlightLayer.getContext('2d')
const piecesContext = piecesLayer.getContext('2d')
const cells = []
const CELL_SIZE = Math.min(boardLayer.width / 5, boardLayer.height / 9)
const pieces = []
const p1 = new Player(1, [])
const p2 = new Player(-1, [])
const p1PiecesPre = document.getElementById('p1pieces')
const p2PiecesPre = document.getElementById('p2pieces')
const turnText = document.getElementById('turn')
let selectedPiece
let turn = 1
let clickablePieces = []
let forcedPieces = []
let options = []

function prettyPrintPieces (pieces) {
  return pieces.map(piece => {
    return {
      location: piece.location != null ? `i: ${piece.location.i + 1}, j: ${piece.location.j + 1}` : 'unknown',
      status: piece.status === 1 ? 'alive' : piece.status === 0 ? 'wounded' : 'dead'
    }
  })
}

function printTurn () {
  turnText.innerText = `Player ${turn > 0 ? 1 : 2}'s Turn`
}

function getPieceColor (piece) {
  if (piece === selectedPiece) return piece.player > 0 ? '#3694d9' : '#ff7b74'
  else if (forcedPieces.includes(piece)) return piece.player > 0 ? '#42bed9' : '#ffbb8e'

  return piece.player > 0 ? '#0074D9' : '#FF4136'
}

function inRange (value, min, max) {
  return (value - min) * (value - max) <= 0
}

function getLocationPiece (location) {
  return pieces.find(piece => piece.location === location)
}

function populatePlayerPieces () {
  p1.pieces.push(new Piece(cells[0][0], 1, 1))
  p1.pieces.push(new Piece(cells[0][2], 1, 1))
  p1.pieces.push(new Piece(cells[0][4], 1, 1))
  p1.pieces.push(new Piece(cells[1][1], 1, 1))
  p1.pieces.push(new Piece(cells[1][3], 1, 1))

  p2.pieces.push(new Piece(cells[8][0], 1, -1))
  p2.pieces.push(new Piece(cells[8][2], 1, -1))
  p2.pieces.push(new Piece(cells[8][4], 1, -1))
  p2.pieces.push(new Piece(cells[7][1], 1, -1))
  p2.pieces.push(new Piece(cells[7][3], 1, -1))

  pieces.push(...p1.pieces)
  pieces.push(...p2.pieces)
}

function drawBoard () {
  boardContext.clearRect(0, 0, boardLayer.width, boardLayer.height)

  for (let i = 0; i < 9; i++) {
    cells.push([])

    for (let j = 0; j < 5; j++) {
      const cell = new Cell(i, j)

      cells[i].push(cell)
      boardContext.beginPath()
      boardContext.fillStyle = (i + j) % 2 !== 0 || i === 4 && j === 2 ? '#663309' : '#eee5c9'
      boardContext.fillRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      boardContext.closePath()
    }
  }

  const xOffset = 17
  const yOffset = 50

  boardContext.font = '48px arial'
  boardContext.strokeText('A', cells[2][0].x + xOffset, cells[2][0].y + yOffset)
  boardContext.strokeText('A', cells[6][4].x + xOffset, cells[6][4].y + yOffset)
  boardContext.strokeText('B', cells[2][4].x + xOffset, cells[2][4].y + yOffset)
  boardContext.strokeText('B', cells[6][0].x + xOffset, cells[6][0].y + yOffset)
  boardContext.strokeText('C', cells[4][0].x + xOffset, cells[4][0].y + yOffset)
  boardContext.strokeText('C', cells[4][4].x + xOffset, cells[4][4].y + yOffset)
  boardContext.strokeText('X', cells[4][2].x + xOffset, cells[4][2].y + yOffset)
}

function drawHighlights () {
  highlightContext.clearRect(0, 0, highlightLayer.width, highlightLayer.height)

  for (const option of options) {
    highlightContext.beginPath()
    highlightContext.fillStyle = 'rgba(30, 30, 30, 0.5)'
    highlightContext.fillRect(option.cell.x, option.cell.y, CELL_SIZE, CELL_SIZE)
    highlightContext.closePath()
  }
}

function drawPieces () {
  piecesContext.clearRect(0, 0, piecesLayer.width, piecesLayer.height)

  for (const piece of pieces) {
    if (piece.status < 0) continue

    piecesContext.beginPath()
    piecesContext.fillStyle = getPieceColor(piece)
    piecesContext.arc(piece.location.x + CELL_SIZE / 2, piece.location.y + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, 2 * Math.PI)
    piecesContext.fill()
  }
}

function getClickedLocation (e) {
  for (const row of cells) {
    for (const cell of row) {
      if (inRange(e.offsetX, cell.x, cell.x + CELL_SIZE) && inRange(e.offsetY, cell.y, cell.y + CELL_SIZE)) return cell
    }
  }
}

function calculateMoveOptions (cell, direction) {
  function checkAvailability (x, y, location) {
    const piece = getLocationPiece(location)

    if (piece != null && x < 9 && x > -1 && y < 5 && y > -1 && cells[x][y] != null) location = cells[x][y]
    if (piece == null || piece.location !== location) options.push(new Option(location, piece))
  }

  options = []

  // Check Regular Cells
  if (cells[cell.i + direction] != null) {
    // Check upwards movement
    if (!(cell.i + direction === 4 && cell.j + 1 === 2) && cells[cell.i + direction][cell.j + 1] != null) {
      const location = cells[cell.i + direction][cell.j + 1]
      const x = cell.i + 2 * direction
      const y = Math.abs(cell.j + 2)

      checkAvailability(x, y, location)
    }

    // Check downwards movement
    if (!(cell.i + direction === 4 && cell.j - 1 === 2) && cells[cell.i + direction][cell.j - 1] != null) {
      const location = cells[cell.i + direction][cell.j - 1]
      const x = cell.i + 2 * direction
      const y = Math.abs(cell.j - 2)

      checkAvailability(x, y, location)
    }
  }

  // Check Special Cells
  if ([2, 4, 6].includes(cell.i) && [0, 4].includes(cell.j)) {
    const coordinates = {
      x: cell.i < 4 ? 6 : cell.i > 4 ? 2 : 4,
      y: Math.abs(cell.j - 4)
    }
    const location = cells[coordinates.x][coordinates.y]
    const x = coordinates.x + direction
    const y = Math.abs(coordinates.y - 1)

    checkAvailability(x, y, location)
  }

  const piece = getLocationPiece(cell)

  // Restrict options to forced movement
  if (forcedPieces.length > 0 && forcedPieces.includes(piece)) {
    options = options.filter(option => option.piece != null && option.piece.player !== piece.player)
  }
}

function handleEndOfTurn () {
  turn = turn * -1
  forcedPieces = []

  forcedPieces = pieces.filter(piece => {
    if (piece.status < 0 || piece.player !== turn) return false

    calculateMoveOptions(piece.location, piece.player)

    return options.some(option => option.piece != null && option.piece.player !== piece.player)
  })

  if (forcedPieces.length > 0) {
    clickablePieces = forcedPieces
  } else {
    clickablePieces = pieces.filter(piece => {
      if (piece.status < 0 || piece.player !== turn) return false

      calculateMoveOptions(piece.location, piece.player)

      return options.length > 0
    })
  }

  if (clickablePieces.length < 1) {
    console.log('END GAME REACHED!')
    // TODO TRIGGER END GAME
  }

  options = []
  selectedPiece = undefined
  printTurn()
}

function handlePieceMovement (cell, option) {
  selectedPiece.location = cell

  if (option.piece != null) {
    if (option.piece.player !== turn) {
      selectedPiece.status--
      option.piece.status = -1
      option.piece.location = null
    }

    calculateMoveOptions(selectedPiece.location, selectedPiece.player)

    if (options.some(option => option.piece != null && option.piece.player !== selectedPiece.player)) {
      clickablePieces = [selectedPiece]
      forcedPieces = [selectedPiece]
      options = []

      return
    }
  }

  handleEndOfTurn()
}

function handlePiecePicking (cell) {
  selectedPiece = getLocationPiece(cell)

  if (selectedPiece != null) {
    if (clickablePieces.includes(selectedPiece)) calculateMoveOptions(cell, selectedPiece.player)
    else selectedPiece = undefined
  }
}

function handleClick (e) {
  const cell = getClickedLocation(e)

  if (selectedPiece != null) {
    const option = options.find(option => option.cell === cell)

    if (option != null) {
      handlePieceMovement(cell, option)
    } else {
      selectedPiece = undefined
      options = []
    }
  } else {
    handlePiecePicking(cell)
  }

  drawHighlights()
  drawPieces()

  p1PiecesPre.innerText = JSON.stringify(prettyPrintPieces(p1.pieces), undefined, 2)
  p2PiecesPre.innerText = JSON.stringify(prettyPrintPieces(p2.pieces), undefined, 2)
}

window.addEventListener('load', () => {
  drawBoard()
  populatePlayerPieces()
  drawPieces()
  printTurn()

  p1PiecesPre.innerText = JSON.stringify(prettyPrintPieces(p1.pieces), undefined, 2)
  p2PiecesPre.innerText = JSON.stringify(prettyPrintPieces(p2.pieces), undefined, 2)

  clickablePieces.push(...p1.pieces)
})

piecesLayer.addEventListener('click', handleClick)
