const server = require('http').createServer();
const io = require('socket.io')(server);
const numberOfPlayer = 3
const updateTime = 50

io.on('connection', client => {
    var direction = 'down'
    var boardSize = {
        w: 80,
        h: 80
    }
    var playerMap = {}
    var updateInterval = null
    var playerId = '1'
    console.log('connected')
    client.on('setup', () => {
        let idList = []
        for (let i = 1; i <= numberOfPlayer; i++) {
            var id = '' + i
            idList.push(id)
            playerMap[id] = {
                id: id,
                direction: 'down',
                x: 0,
                y: 0
            }
        }
        client.emit('setup', {
            idList: idList,
            playerId: '1',
            updateTime: updateTime
        })
    })

    function getRandomDirection() {
        let random = Math.floor(Math.random() * 4)
        switch (random) {
            case 0: return 'up'
            case 1: return 'right'
            case 2: return 'down'
            case 3: return 'left'
        }
    }

    function botMove(id, direction) {
        playerMap[id].direction = direction
        setTimeout(() => {
            botMove(id, getRandomDirection())
        }, Math.random() * 400 + 100)
    }

    client.on('start', () => {
        for (var i in playerMap) {
            if (i !== playerId) {
                botMove(i, getRandomDirection())
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
            client.emit('state', playerMap)
        }, updateTime)
    });
    client.on('move', data => {
        if (playerMap[data.id]) {
            playerMap[data.id].direction = data.direction
        }
    
    });
    client.on('disconnect', () => {
        console.log('disconnect')
        clearInterval(updateInterval)
    });
});

server.listen(3000);