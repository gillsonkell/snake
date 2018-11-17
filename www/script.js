let canvas = document.getElementById('game-canvas');
let context = canvas.getContext('2d');
let tileSize = 32;
let gameStarted = false;
let gameStepInterval;
let snake;
let food;
let isNative = ['http:', 'https:'].indexOf(window.location.protocol) === -1;

if (window.location.search === '?browser') {
	isNative = false;
}

// Make the canvas fullscreen.
canvas.width = Math.floor(window.innerWidth / tileSize) * tileSize;
canvas.height = Math.floor(window.innerHeight / tileSize) * tileSize;

// Listen for swipe events.
let hammer = new Hammer(canvas);
hammer.get('swipe').set({direction: Hammer.DIRECTION_ALL});
hammer.on('swipe', (event) => {
	if (!snake) {
		return;
	}

	// Change the snake's direction.
	if (event.direction === Hammer.DIRECTION_UP && snake.direction !== 'down') {
		snake.direction = 'up';
	} else if (event.direction === Hammer.DIRECTION_DOWN && snake.direction !== 'up') {
		snake.direction = 'down';
	} else if (event.direction === Hammer.DIRECTION_RIGHT && snake.direction !== 'left') {
		snake.direction = 'right';
	} else if (event.direction === Hammer.DIRECTION_LEFT && snake.direction !== 'right') {
		snake.direction = 'left';
	}

	if (!gameStarted) {
		startGame();
	}
});

if (isNative) {
	document.addEventListener('deviceready', () => {
		initializeGame();
		updateCanvas();
	}, false);
} else {
	initializeGame();
	updateCanvas();
}

function initializeGame() {
	gameStarted = false;
	snake = {
		x: Math.ceil((canvas.width / tileSize) / 2) - 1,
		y: Math.ceil((canvas.height / tileSize) / 2) - 1,
		direction: null,
		tailLength: 0,
		tailPositions: []
	};
	food = {
		x: randomCoordinate('width'),
		y: randomCoordinate('height')
	};
	updateCanvas();
};

function startGame() {
	gameStarted = true;
	gameStepInterval = setInterval(gameStep, 200);
}

function gameStep() {
	// Eat the food.
	if (snake.x === food.x && snake.y === food.y) {
		snake.tailLength += 1;
		food.x = randomCoordinate('width');
		food.y = randomCoordinate('height');
	}
	
	// Move the tail along.
	snake.tailPositions.unshift({
		x: snake.x,
		y: snake.y
	});
	if (snake.tailPositions.length > snake.tailLength) {
		snake.tailPositions.splice(-1, 1);
	}
	
	// Move the snake.
	if (snake.direction === 'up') {
		snake.y -= 1;
	} else if (snake.direction === 'down') {
		snake.y += 1;
	} else if (snake.direction === 'right') {
		snake.x += 1;
	} else if (snake.direction === 'left') {
		snake.x -= 1;
	}
	
	// End the game if the snake hits a side of the screen or its tail.
	var collisionFound = false;
	if (snake.x > canvas.width / tileSize - 1 || snake.y > canvas.height / tileSize - 1 || snake.x < 0 || snake.y < 0) {
		collisionFound = true;
	} else {
		for (let i = 0; i < snake.tailPositions.length; i++) {
			let tailPosition = snake.tailPositions[i];
			if (snake.x === tailPosition.x && snake.y === tailPosition.y) {
				collisionFound = true;
				break;
			}
		}
	}
	if (collisionFound) {
		clearInterval(gameStepInterval);
		let oldHighScore = localStorage.highScore || 0;
		localStorage.highScore = (oldHighScore < snake.tailLength ? snake.tailLength : oldHighScore);
		let message = (localStorage.highScore > oldHighScore ? 'New high score!\n' : '');
		message += 'Score: ' + snake.tailLength + '\n';
		message += (localStorage.highScore > oldHighScore ? 'Old high' : 'High') + ' score: ' + oldHighScore;
		showMessage('Game Over', message, () => {
			initializeGame();
		});
		return;
	}
	
	updateCanvas();
};

function updateCanvas() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	// Draw the grid.
	/*
	context.strokeStyle = 'rgb(240, 240, 240)';
	for (let x = 1; x < canvas.width / tileSize; x++) {
		context.beginPath();
		context.moveTo(x * tileSize, 0);
		context.lineTo(x * tileSize, canvas.height);
		context.stroke();
	}
	for (let y = 1; y < canvas.height / tileSize; y++) {
		context.beginPath();
		context.moveTo(0, y * tileSize);
		context.lineTo(canvas.width, y * tileSize);
		context.stroke();
	}
	*/
	
	// Draw the snake.
	context.fillStyle = 'black';
	context.fillRect(snake.x * tileSize, snake.y * tileSize, tileSize, tileSize);
	
	// Draw the snake's tail.
	for (let i = 0; i < snake.tailPositions.length; i++) {
		let tailPosition = snake.tailPositions[i];
		context.fillRect(tailPosition.x * tileSize + 4, tailPosition.y * tileSize + 4, tileSize - 8, tileSize - 8);
	}
	
	// Draw the food.
	context.fillRect(food.x * tileSize + tileSize / 4, food.y * tileSize + tileSize / 4, tileSize / 2, tileSize / 2);
}

function randomCoordinate(dimension) {
	return Math.floor(Math.random() * (canvas[dimension] / tileSize));
}

function showMessage(title, message, callback) {
	if (isNative) {
		navigator.notification.alert(message, callback, title);
	} else {
		alert(message);
		callback();
	}
}
