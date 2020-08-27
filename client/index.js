var host = window.location.href
host = host.includes('tientm.com') ? 'http://128.199.190.81:3000' : 'http://127.0.0.1:3000'
console.log(host);
const socket = io(host);

const mapKeyCodeToAction = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
}
const ratio = 20
var playerId = null
var updateTime = 50
var gameDuration = 0
var timer = null

socket.on('setup', data => {
    playerId = data.playerId
    updateTime = data.updateTime
    gameDuration = data.gameDuration
    $('#board').css({
        width: data.boardSize.w * ratio,
        height: data.boardSize.h * ratio
    })
    $('#board').empty()
    $('#score-container').empty()
    var totalSecond = gameDuration / 1000
    var minute = Math.floor(totalSecond / 60)
    var second = totalSecond % 60
    $('#timer').html(`${minute}:${second}`)
    for (var id in data.playerMap) {
        var player = data.playerMap[id]
        var color = data.playerMap[id].color
        var zIndex = id === data.playerId ? 100 : 99
        $('#board').append(`<div id="${id}" class="player">${buildCatIcon(player.color, ratio)}</div>`)
        $('#' + id).css({
            zIndex: zIndex,
            width: ratio,
            height: ratio,
            top: player.y * ratio,
            left: player.x * ratio
        })
        $('#score-container').append(`<div id="score-${id}" class="player-score" style="color:${color};">Player ${id}: 0</div>`)
    }
    $('#board').append(`<div class="egg" id="egg">${buildFishIcon('blue', ratio)}</div>`)
    $('#egg').css({
        top: data.egg.y * ratio,
        left: data.egg.x * ratio,
        width: ratio + 'px',
        height: ratio + 'px',
    })
    $('#start').css('display', 'block')
    $('#stop').css('display', 'none')
})

socket.on('state', playerMap => {
    for (var i in playerMap) {
        var player = playerMap[i]
        var playerEl = $('#' + i)
        playerEl.stop()
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

socket.on('stop', winner => {
    clearInterval(timer)
    if (!winner) {
        return
    }
    $('#modal-body').html(`Winner: Player ${winner.id} <br> Score: ${winner.score}`)
    $('#modal').modal('toggle')
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
    second--
    $('#timer').html(`${minute}:${second < 10 ? '0' + second : second}`)
    timer = setInterval(() => {
        second--
        if (second < 0) {
            minute--
            if (minute < 0) {
                minute = 0
                second = 0
                clearInterval(timer)
            } else {
                second = 60
            }
        }
        $('#timer').html(`${minute}:${second < 10 ? '0' + second : second}`)
    }, 1000)
}

function restart() {
    $('#modal').modal('toggle')
    socket.emit('setup')
}

function stop() {
    $('#stop').css('display', 'none')
    $('#start').css('display', 'block')
    socket.emit('stop')
}

socket.emit('setup')

function buildCatIcon(color, height) {
    color = color || '#000'
    height = height || 10
    return `
    <svg width="${height}px" height="${height}px" viewBox="0 0 338.000000 338.000000" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(0.000000,338.000000) scale(0.100000,-0.100000)" fill="${color}" stroke="none">
            <path d="M837 3115 c-3 -11 -27 -121 -52 -245 -144 -698 -228 -1082 -254
            -1165 -38 -118 -51 -196 -51 -312 0 -51 -1 -93 -3 -93 -33 0 -433 -94 -439
            -103 -12 -19 -10 -33 8 -48 14 -12 49 -7 231 30 117 24 215 42 217 40 2 -2 15
            -42 31 -89 15 -47 34 -97 41 -112 17 -32 35 -25 -170 -67 -145 -31 -179 -47
            -160 -79 17 -27 48 -25 222 11 l162 34 44 -61 c162 -226 429 -392 739 -457
            145 -31 381 -31 524 -1 327 70 594 238 754 473 29 43 45 59 57 55 51 -15 367
            -76 392 -76 34 0 51 33 27 57 -10 10 -359 93 -392 93 -1 0 10 35 26 78 16 42
            33 95 39 118 l10 41 246 -50 c183 -38 250 -48 262 -40 20 12 25 33 14 50 -5 7
            -120 37 -258 65 l-249 53 -2 105 c-2 107 -21 216 -54 305 -15 42 -124 553
            -261 1220 -17 83 -34 153 -37 157 -4 4 -90 -159 -191 -363 -164 -329 -187
            -369 -205 -364 -297 89 -573 94 -824 16 l-63 -20 -187 382 c-136 276 -189 376
            -194 362z m408 -1199 c160 -95 106 -406 -71 -406 -55 0 -82 11 -118 46 -80 80
            -89 231 -19 315 61 72 134 88 208 45z m989 1 c89 -50 123 -194 72 -304 -53
            -112 -177 -139 -259 -57 -41 41 -59 80 -64 143 -16 173 122 292 251 218z"/>
        </g>
    </svg>`
}

function buildFishIcon(color, height) {
    color = color || '#000'
    height = height || 10
    width = height * 980 / 584
    return `
    <svg width="${width}px" height="${height}px" viewBox="0 0 980.000000 584.000000" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(0.000000,584.000000) scale(0.100000,-0.100000)" fill="${color}" stroke="none">
            <path d="M4205 5812 c-51 -32 -85 -80 -85 -118 0 -96 100 -467 219 -814 39
            -113 71 -212 71 -222 0 -19 -16 -25 -287 -119 -383 -132 -789 -307 -1118 -481
            -296 -157 -678 -384 -768 -456 l-38 -31 -122 101 c-305 251 -623 444 -1051
            639 -346 157 -801 329 -874 329 -60 0 -133 -57 -148 -117 -9 -34 16 -120 82
            -286 209 -525 495 -1001 803 -1337 l59 -66 -95 -114 c-249 -297 -432 -577
            -607 -927 -87 -174 -140 -291 -189 -424 -52 -137 -60 -182 -43 -222 16 -40 65
            -83 103 -91 107 -24 872 286 1335 540 243 133 441 267 614 416 51 43 98 78
            106 78 8 0 98 -54 201 -120 487 -312 820 -484 1332 -690 127 -51 240 -97 252
            -104 22 -11 22 -11 -38 -171 -126 -338 -224 -678 -236 -819 -6 -71 -5 -73 27
            -110 37 -42 78 -66 113 -66 134 0 1045 455 1493 745 l115 75 157 -17 c192 -20
            812 -23 1022 -4 644 57 1354 299 1917 652 494 311 964 753 1172 1107 53 88
            101 222 101 280 0 86 -56 211 -170 382 -431 641 -1161 1169 -2005 1449 -440
            145 -855 215 -1366 230 -229 6 -258 9 -286 26 -17 11 -129 86 -249 166 -247
            166 -395 253 -634 374 -341 172 -731 340 -812 351 -32 4 -51 0 -73 -14z m4046
            -2384 c66 -31 124 -88 153 -148 32 -69 29 -197 -6 -265 -31 -60 -87 -114 -148
            -146 -62 -32 -184 -33 -251 -2 -67 30 -124 86 -156 151 -23 48 -27 70 -27 137
            0 71 4 87 34 143 58 110 157 166 281 159 43 -3 85 -13 120 -29z"/>
        </g>
    </svg>`
}