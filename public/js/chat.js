const socket = io()

// Form Elements
const chatForm = document.querySelector('#chat_form')
const locationMessageDiv = document.querySelector('#location_message_div')
const logoutBtn = document.querySelector('#logout_btn')
const messagesContainer = document.querySelector('#messages_container')
const msgFieldBtn = chatForm.querySelector('#message_field_btn')
const msgFieldInput = chatForm.querySelector('#message_field')
const sendLocationBtn = document.querySelector('#send_location_btn')
const sidebarContainer = document.querySelector('#sidebar_container')


// Templates
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse( location.search, {ignoreQueryPrefix: true} )

const autoscroll = () => {
    // New message element
    const newMessageElm = messagesContainer.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle( newMessageElm )
    const newMessageMargin = parseInt( newMessageStyles.marginBottom )
    const newMessageHeight = newMessageElm.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messagesContainer.offsetHeight

    // Height of messages continer
    const containerHeight = messagesContainer.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messagesContainer.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
}

socket.on('locationMessage', ({username, url, locationCreatedAt}) => {
    const html = Mustache.render(locationMessageTemplate, {
        username,
        url,
        locationCreatedAt: moment(locationCreatedAt).format('HH:mm')
    })

    messagesContainer.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    })

    messagesContainer.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({users, room}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    sidebarContainer.innerHTML = html
})

chatForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // disable submit button
    msgFieldBtn.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', msgFieldInput.value, (error) => {
        // enable submit button
        msgFieldBtn.removeAttribute('disabled')
        msgFieldInput.value = ""
        msgFieldInput.focus()

        // Was used if profanity was used...
        if (error) {
            console.log(error)
        }
    })
 })

logoutBtn.addEventListener('click', () => {
    if ( confirm('Log out?') ) {
        location.href = '/'
    }
})

sendLocationBtn.addEventListener('click', () => {
    if ( !navigator.geolocation ) {
        return alert("Geolocation is not supported by your browser.")
    } 

    sendLocationBtn.textContent = "Sharing location..."
    sendLocationBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition( (position) => {
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        },
        () => {
            sendLocationBtn.removeAttribute('disabled')
            sendLocationBtn.textContent = "Location Shared"
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if( error ) {
        alert(error)

        location.href = '/'
    }
})
