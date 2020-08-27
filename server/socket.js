const { clearInterval } = require('timers');

const server = require('http').createServer();
const io = require('socket.io')(server);
const numberOfPlayer = 3
const updateTime = 50
const gameDuration = (1 * 60 + 30) * 1000
const boardSize = {
    w: 80,
    h: 80
}

function getEgg() {
    return {
        x: Math.floor(Math.random() * boardSize.w),
        y: Math.floor(Math.random() * boardSize.h)
    }
}

io.on('connection', client => {
    console.log('connected')

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
                score: 0
            }
        }
        client.emit('setup', {
            idList: idList,
            playerId: '1',
            updateTime: updateTime,
            egg: egg,
            gameDuration: gameDuration
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
                    console.log(`player ${i}: ${player.score}`);
                    egg = getEgg()
                    client.emit('egg', egg)
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
        client.emit('stop')
    });
    client.on('disconnect', () => {
        console.log('disconnect')
        clearInterval(updateInterval)
        clearTimeout(statusTimeout)
    });
});

server.listen(3000);