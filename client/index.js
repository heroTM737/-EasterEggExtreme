const socket = io('http://127.0.0.1:3000');

const mapKeyCodeToAction = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
}
const ratio = 10
var playerId = null
var updateTime = 50

socket.on('setup', data => {
    playerId = data.playerId
    updateTime = data.updateTime
    for (var id of data.idList) {
        var color = id === data.playerId ? 'red' : 'black'
        var zIndex = id === data.playerId ? 100 : 99
        $('#board').append(`<div id="${id}" class="player" style="background:${color};z-index:${zIndex}"></div>`)
    }
})

socket.on('state', playerMap => {
    for (var i in playerMap) {
        var player = $('#' + i)
        var position = playerMap[i]
        player.animate({
            top: position.y * ratio,
            left: position.x * ratio
        }, updateTime)
    }
})

$('body').keydown(event => {
    socket.emit('move', {
        id: playerId,
        direction: mapKeyCodeToAction[event.keyCode]
    })
})

function start() {
    socket.emit('start')
}

socket.emit('setup')