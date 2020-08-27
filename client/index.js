var host = window.location.href
host = host.includes('tientm.com') ? 'http://easter-egg-extreme.tientm.com' : 'http://127.0.0.1:3000'
host = 'http://128.199.190.81:3000'
console.log(host);
const socket = io(host);

const mapKeyCodeToAction = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
}
const ratio = 10
var playerId = null
var updateTime = 50
var gameDuration = 0
var timer = null

socket.on('setup', data => {
    playerId = data.playerId
    updateTime = data.updateTime
    gameDuration = data.gameDuration
    var totalSecond = gameDuration / 1000
    var minute = Math.floor(totalSecond / 60)
    var second = totalSecond % 60
    $('#timer').html(`${minute}:${second}`)
    for (var id of data.idList) {
        var color = id === data.playerId ? 'red' : 'black'
        var zIndex = id === data.playerId ? 100 : 99
        $('#board').append(`<div id="${id}" class="player" style="background:${color};z-index:${zIndex}"></div>`)
        $('#score-container').append(`<div id="score-${id}" class="player-score" style="color:${color}">Player ${id}: 0</div>`)
    }
    $('#egg').css({
        top: data.egg.y * ratio,
        left: data.egg.x * ratio
    })
})

socket.on('state', playerMap => {
    for (var i in playerMap) {
        var playerEl = $('#' + i)
        var player = playerMap[i]
        playerEl.animate({
            top: player.y * ratio,
            left: player.x * ratio
        }, updateTime)
        $('#score-' + i).html(`Player ${i}: ${player.score}`)
    }
})

socket.on('egg', egg => {
    $('#egg').css({
        top: egg.y * ratio,
        left: egg.x * ratio
    })
})

socket.on('stop', egg => {
    clearInterval(timer)
})

$('body').keydown(event => {
    socket.emit('move', {
        id: playerId,
        direction: mapKeyCodeToAction[event.keyCode]
    })
})

function start() {
    $('#start').css('display', 'none')
    $('#stop').css('display', 'block')
    socket.emit('start')
    var totalSecond = gameDuration / 1000
    var minute = Math.floor(totalSecond / 60)
    var second = totalSecond % 60
    timer = setInterval(() => {
        second--
        if (second < 0) {
            minute--
            if (minute < 0) {
                minute = 0
                clearInterval(timer)
            } else {
                second = 60
            }
        }
        $('#timer').html(`${minute}:${second < 10 ? '0' + second : second}`)
    }, 1000)
}

function stop() {
    $('#stop').css('display', 'none')
    $('#start').css('display', 'block')
    socket.emit('stop')
}

socket.emit('setup')