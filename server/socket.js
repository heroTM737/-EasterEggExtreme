const { clearInterval } = require('timers');

const server = require('http').createServer();
const io = require('socket.io')(server);
const numberOfPlayer = 3
const updateTime = 100
const gameDuration = (1 * 60 + 30) * 1000
const boardSize = {
    w: 30,
    h: 20
}

const catColorList = ['#70AD47', '#FFC000', '#ED7D31', '#70AD47', 'pink', 'brown']

function getEgg() {
    return {
        x: Math.floor(Math.random() * boardSize.w),
        y: Math.floor(Math.random() * boardSize.h)
    }
}

io.on('connection', client => {
    var playerMap = {}
    var updateInterval = null
    var statusTimeout = null
    var playerId = '1'
    var egg = getEgg()
    var gameStatus = false
    client.on('setup', () => {
        let idList = []
        for (let i = 1; i <= numberOfPlayer; i++) {
            var id = '' + i
            idList.push(id)
            playerMap[id] = {
                id: id,
                direction: 'down',
                x: 0,
                y: 0,
                score: 0,
                color: catColorList[i]
            }
        }
        client.emit('setup', {
            playerMap: playerMap,
            playerId: '1',
            updateTime: updateTime,
            egg: egg,
            gameDuration: gameDuration,
            boardSize: boardSize
        })
    })

    function botMove(id) {
        if (!gameStatus) {
            return
        }
        var player = playerMap[id]
        var directionList = []
        if (player.y !== egg.y) {
            directionList.push(player.y < egg.y ? 'down' : 'up')
        }
        if (player.x != egg.x) {
            directionList.push(player.x < egg.x ? 'right' : 'left')
        }
        player.direction = directionList.length < 1 ? player.direction : directionList[Math.floor(Math.random() * directionList.length)]
        setTimeout(() => {
            botMove(id)
        }, Math.random() * 400 + 100)
    }

    client.on('start', () => {
        gameStatus = true
        statusTimeout = setTimeout(() => {
            gameStatus = false
            clearInterval(updateInterval)
            var winner = {
                score: 0
            }
            for (let i in playerMap) {
                if (playerMap[i].score > winner.score) {
                    winner = playerMap[i]
                }
            }
            client.emit('stop', winner)
        }, gameDuration)
        for (var i in playerMap) {
            if (i !== playerId) {
                botMove(i)
            }
        }
        updateInterval = setInterval(() => {
            for (var i in playerMap) {
                var player = playerMap[i]
                switch (player.direction) {
                    case 'up':
                        player.y = Math.max(0, player.y - 1)
                        break
                    case 'down':
                        player.y = Math.min(boardSize.h - 1, player.y + 1)
                        break
                    case 'left':
                        player.x = Math.max(0, player.x - 1)
                        break
                    case 'right':
                        player.x = Math.min(boardSize.w - 1, player.x + 1)
                        break
                }
            }
            for (var i in playerMap) {
                var player = playerMap[i]
                if (player.x === egg.x && player.y === egg.y) {
                    player.score++
                    egg = getEgg()
                    setTimeout(() => {
                        client.emit('egg', egg)
                    }, updateTime)
                    break
                }
            }
            client.emit('state', playerMap)
        }, updateTime)
    });
    client.on('move', data => {
        if (playerMap[data.id]) {
            playerMap[data.id].direction = data.direction
        }

    });
    client.on('stop', data => {
        gameStatus = false
        clearInterval(updateInterval)
        clearTimeout(statusTimeout)
        client.emit('stop', null)
    });
    client.on('disconnect', () => {
        clearInterval(updateInterval)
        clearTimeout(statusTimeout)
    });
});

server.listen(3000);