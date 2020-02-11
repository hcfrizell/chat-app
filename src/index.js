const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const bwFilter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
// Create server outside express library and configured to use express app.
const server = http.createServer(app)
const io = socketio( server ) // Socket.io expects to be called with the raw http server. Express creates this behind the sences.

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join( __dirname, '../public' )

app.use( express.static( publicDirectoryPath ) )

let msgArray = []

io.on( 'connection', (socket) => {
    socket.on( 'join', ({username, room}, callback ) => {
        const {error, user} = addUser({id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit( 'message', generateMessage('System', 'Hello new connection') )

        socket.broadcast.to(user.room).emit('message', generateMessage('System', `${user.username} has joined!`) )

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const filter = new bwFilter()

        if ( filter.isProfane(msg) ) {
           // return callback('Profanity is not allowed')
        }

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username, msg))

        msgArray.push( generateMessage(user.username, msg) )
        io.emit('updateMsgInfo', msgArray )

        callback()
    })

    socket.on('sendLocation', ({lat, long}, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit( 'locationMessage', generateLocationMessage(user.username, {lat, long}) )

        callback()
    })


    socket.on('disconnect', () => {
        const user = removeUser( socket.id )

        if ( user ) {
            io.to(user.room).emit('message', generateMessage('System',`${user.username} has left room.`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen( port, () => {
    console.log(`Chat-App on port: ${port}`)
})