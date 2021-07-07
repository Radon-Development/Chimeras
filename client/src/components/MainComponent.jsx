import React, { useEffect, useRef, useState } from "react";
import { ProSidebar, SidebarHeader, SidebarFooter, SidebarContent } from 'react-pro-sidebar';
import { useHistory } from 'react-router-dom'
import "../styles/main-component.css"
import MicrosoftTeams from "../assets/microsoft-teams.svg";
import { connect } from 'react-redux';
import axios from 'axios';
import { v1 as uuid } from "uuid";
import { io } from "socket.io-client"
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import Switch from "react-switch";
import sendFilled from '@iconify/icons-carbon/send-filled';
import menuIcon from '@iconify/icons-carbon/menu';
import desktopArrowRight24Regular from '@iconify/icons-fluent/desktop-arrow-right-24-regular';
import bxLogOut from '@iconify/icons-bx/bx-log-out';
import ReactTooltip from 'react-tooltip';
import { prodUrl as url } from "../Config/config.json"

const MainComponent = (props) => {
    const {
        socket,
        setSocket,
        name,
        setName,
        id,
        setUserId,
        setAuth,
        joiningRoom,
        setJoiningRoom,
        joiningPath,
        setJoiningPath
    } = props
    const [rooms, setRooms] = useState([])
    const [room, setRoom] = useState(undefined)
    const roomRef = useRef(undefined)
    const roomsRef = useRef([])
    const [chats, setChats] = useState([])
    const [roomID, setRoomId] = useState('')
    const [message, setMessage] = useState('')
    const [modalIsOpen, setmodalIsOpen] = useState(false)
    const [modalCreateRoomIsOpen, setmodalCreateRoomIsOpen] = useState(false)
    const [roomName, setRoomName] = useState('')
    const [roomSideBar, setRoomSideBar] = useState(true)
    const messagesEndRef = useRef(null)
    const history = useHistory()
    const [customBackground, setCustomBackground] = useState(false)

    const customStylesModal = {
        overlay: {
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 2
        },
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px'
        },
    };


    useEffect(async () => {
        if (joiningRoom && socket != null) {
            joinRoom(joiningRoom)

        }
        if (!socket) {
            var socketNew = io.connect(`${url}`)

            socketNew.on("connect", () => {
                axios({
                    url: `${url}/updateSocket`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
                    },
                    data: {
                        "socketId": socketNew.id
                    }
                }).then(data => {
                    console.log(data)

                })
                console.log(socketNew)
                setSocket(socketNew)

            })

        }


        axios({
            url: `${url}/getChats`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
            }
        }).then(data => {
            setName(data.data.user.name)
            setUserId(data.data.user._id)
            roomsRef.current = roomsRef.current.concat(data.data.rooms)
            setRooms(roomsRef.current)

        })
    }, [])


    useEffect(() => {
        if (socket) {
            if (joiningRoom) {
                joinRoom(joiningRoom)

            }
            socket.on("receivedMessage", (payload) => {

                const { name, message, id, roomID } = payload

                if (roomRef.current && roomRef.current.roomID == roomID) {
                    var roomUpdate = roomRef.current
                    console.log(roomRef.current)
                    roomUpdate.chats = [...roomUpdate.chats, { name, message, userId: id }]
                    roomRef.current = roomUpdate
                    console.log(roomRef.current)
                    setChats(roomUpdate.chats)
                    setRoom(roomRef.current)
                }
                for (var i = 0; i < roomsRef.current.length; i++) {
                    if (roomsRef.current[i].roomID == roomID) {
                        roomsRef.current[i].chats = [...roomsRef.current[i].chats, { name, message, userId: id }]
                    }
                }
                // roomsRef.current = roomsUpdate
                setRooms(roomsRef.current)
                scrollToBottom()
            })
        }
    }, [socket])
    const createRoom = () => {
        axios({
            url: `${url}/createRoom`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
            },
            data: {
                roomID: uuid(),
                socketId: socket.id,
                roomName: roomName || undefined
            }
        }).then(data => {
            console.log(data)
            const roomsUpdate = [...roomsRef.current, data.data]
            roomsRef.current = roomsUpdate
            setRooms(roomsRef.current)
            toast.info(`Created Room ${data.data.roomName}`, {
                position: 'top-left'
            })
            setmodalCreateRoomIsOpen(false)
        })
    }

    const joinRoom = (RoomJoiningID) => {
        console.log(RoomJoiningID)

        if (!RoomJoiningID)
            return toast.error("Room ID can't be empty!")
        var roomIdFormat = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/;
        if (!roomIdFormat.test(RoomJoiningID))
            return toast.error("Incorrect roomID");

        axios({
            url: `${url}/joinRoom`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('TeamsToken')}`
            },
            data: {
                roomID: RoomJoiningID,
                socketId: socket.id
            }
        }).then(data => {
            console.log(data)
            const roomsUpdate = [...roomsRef.current, data.data]
            roomsRef.current = roomsUpdate
            setRooms(roomsRef.current)
            setmodalIsOpen(false)
            toast.info(`Joined Room "${data.data.roomName}"`, {
                position: 'top-left'
            })
            if (joiningRoom) {
                setJoiningRoom(null)
                if (joiningPath) {
                    history.push(`${joiningPath}/${RoomJoiningID}`)
                    setJoiningPath(null)
                }
            }
            return "joined"

        }).catch(err => {

            toast.error(err.response.data.error)
            if (joiningRoom) {
                setJoiningRoom(null)
                if (joiningPath) {
                    history.push(`${joiningPath}/${RoomJoiningID}`)
                    setJoiningPath(null)
                }
            }
            return "not joined"
        })
    }

    const selectRoom = (e) => {

        var roomID = e.target.dataset.roomid;
        var room = rooms.filter(room => room.roomID == roomID)
        setChats(room[0].chats)
        setRoom(room[0])
        roomRef.current = room[0];
        if (messagesEndRef.current)
            scrollToBottom()
        if (window.screen.width <= 660)
            setRoomSideBar(false)
    }
    const sendMessage = (sendMessage) => {
        const payload = { name, message: sendMessage, id: id, roomID: room.roomID };
        socket.emit("send message", payload);
        const roomUpdate = roomRef.current;
        const chatUpdate = chats;
        chatUpdate.push({ name, message, userId: id })
        roomUpdate.chats = chatUpdate
        for (var i = 0; i < roomsRef.current.length; i++)
            if (roomsRef.current[i].roomID == room.roomID) {
                roomsRef.current[i].chats = chatUpdate;
            }

        roomRef.current = roomUpdate
        console.log(roomsRef.current)
        setChats(chatUpdate)
        setRoom(roomRef.current)
        setRooms(roomsRef.current)
        scrollToBottom()
    }
    useEffect(() => {
        scrollToBottom()
    })
    const scrollToBottom = () => {
        if (messagesEndRef.current)
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="main-component-parent">

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => {
                    setmodalIsOpen(false)
                }}
                style={customStylesModal}
                id="modal-main-component"
                contentLabel="Name Modal"
            >
                <h3>Join Room</h3>
                <div className="modal-content-home">
                    <input
                        type="text"
                        className="modal-input-main-component"
                        placeholder="Enter room ID"
                        value={roomID}
                        onChange={(e) => {
                            setRoomId(e.target.value)
                        }}
                    />
                </div>
                <button className="join-room-main-chat"
                    onClick={() => {
                        joinRoom(roomID)
                    }}>
                    Join room
                </button>
            </Modal>
            <Modal
                isOpen={modalCreateRoomIsOpen}
                onRequestClose={() => {
                    setmodalCreateRoomIsOpen(false)
                }}
                style={customStylesModal}
                id="modal-main-component"
                contentLabel="Name Modal"
            >
                <h3>Create Room</h3>
                <div className="modal-content-home">
                    <input
                        type="text"
                        className="modal-input-main-component"
                        placeholder="Enter room name (optional)"
                        value={roomName}
                        onChange={(e) => {
                            setRoomName(e.target.value)
                        }}
                    />
                </div>
                <button className="join-room-main-chat"
                    onClick={() => {
                        createRoom()
                    }}>
                    Create room
                </button>
            </Modal>

            <div className="main-component-header">
                <div className="header-logo-box">
                    <Icon icon={menuIcon}
                        style={{ fontSize: '40px' }}
                        onClick={() => {
                            setRoomSideBar(!roomSideBar)
                        }}
                    />
                    <img src={MicrosoftTeams} className="logo-main-component" alt="Microsoft Teams" />
                    <h3>Microsoft Teams</h3>

                </div>
                <div className="top-header-side-options">
                    <span className="room-join-options-hover" >
                        +
                        <ul className="room-join-options">
                            <li onClick={() => {
                                setmodalCreateRoomIsOpen(true)
                            }}>Create Room</li>
                            <li
                                onClick={() => {
                                    setmodalIsOpen(true)
                                }}>Join Room</li>
                        </ul>

                    </span>
                    <Icon
                        data-tip="Sign Out"
                        onClick={() => {
                            setAuth(false)
                            localStorage.removeItem('TeamsToken')
                            history.push("/signin")
                        }}
                        icon={bxLogOut} />
                </div>
            </div>
            <div className="main-component-content">
                <ProSidebar collapsed={!roomSideBar} collapsedWidth="0px" className="main-chat-pro-sidebar">
                    <SidebarHeader className="main-chat-pro-header">
                        <h4>
                            Rooms
                        </h4>
                    </SidebarHeader>
                    <SidebarContent className="main-chat-pro-content">
                        {rooms.map(roomEach => {
                            return (
                                <div className="sidebar-room"
                                    data-roomid={roomEach.roomID}
                                    id={room && room.roomID == roomEach.roomID ? 'selectedRoom' : 'null'}
                                    onClick={(e) => {
                                        selectRoom(e)
                                    }}
                                >
                                    <div className="room-initial"
                                        data-roomid={roomEach.roomID}
                                        onClick={(e) => {
                                            selectRoom(e)
                                        }}
                                    >
                                        {roomEach.roomName.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="room-name"
                                        data-roomid={roomEach.roomID}
                                        onClick={(e) => {
                                            selectRoom(e)
                                        }}>
                                        {roomEach.roomName}
                                    </div>
                                </div>
                            )
                        })

                        }
                    </SidebarContent>
                </ProSidebar>
                {room ? <ProSidebar collapsed={false} collapsedWidth="0px" className="main-chat-chats-box">
                    <SidebarHeader className="main-chat-chats-box-header">
                        <div className="room-detail">
                            <div className="room-initial-chat-box-header">
                                {room.roomName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="room-name">
                                <h4>{room.roomName}</h4>
                                <h5>Room id : {room.roomID}</h5>
                            </div>
                        </div>
                        <div className="room-options-chat">
                            <Switch
                                className="background-switcher-chat"
                                uncheckedIcon={false}
                                checkedIcon={false}
                                height={20}
                                width={40}
                                data-tip="Change Wallpaper"
                                onChange={(val) => {
                                    setCustomBackground(val)
                                    if (val)
                                        document.
                                            getElementsByClassName('main-chat-chats-box-content')[0].
                                            style.backgroundImage = `url("https://picsum.photos/1920/1080")`
                                    else
                                        document.
                                            getElementsByClassName('main-chat-chats-box-content')[0].
                                            style.backgroundImage = null
                                }} checked={customBackground}
                            />
                            <div className="join-meet-outer-box"
                                data-tip="Join Meeting"
                            >
                                <div className="join-meet-outer"
                                    data-tip="Join Meeting"
                                    data-roomid={room.roomID}
                                    onClick={(e) => {
                                        history.push(`/home/${e.target.dataset.roomid}`)
                                    }}
                                ></div>
                                <Icon
                                    icon={desktopArrowRight24Regular}
                                    className="join-meet-main-chat"
                                    data-tip="Join Meeting"
                                />

                            </div>
                        </div>
                    </SidebarHeader>
                    <SidebarContent className="main-chat-chats-box-content">
                        {chats.map(chat => {
                            return (
                                <div className="sidebar-room-chat" id={chat.userId == id ? 'shiftChat' : null}>
                                    <div className="room-initial-chat" style={{ backgroundColor: '#333' }}>
                                        {chat.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="chat-user">
                                        <h4 className="chat-user-name">
                                            {chat.userId == id ? 'You' : chat.name}
                                        </h4>
                                        <div className="chat-user-message">
                                            {chat.message}
                                        </div>
                                    </div>
                                </div>
                            )
                        })

                        }
                        <div ref={messagesEndRef} ></div>
                    </SidebarContent>
                    <SidebarFooter className="main-chat-chats-box-footer">
                        <input
                            type="text"
                            placeholder="Type here"
                            className="chat-entry"
                            onKeyPress={(e) => {
                                e = e || window.event;
                                if (e.key == "Enter") {
                                    sendMessage(message);
                                    setMessage("")
                                }
                            }}
                            onChange={(e) => {
                                setMessage(e.target.value)
                            }}
                            value={message}
                        />
                        <Icon
                            icon={sendFilled}
                            style={{ color: '#333' }}
                            onClick={() => {
                                sendMessage(message);
                                setMessage('')
                            }} />
                    </SidebarFooter>
                </ProSidebar> :
                    <div className="no-room-selected">
                        <h1>Select Your Room !</h1>
                        <h3>OR</h3>
                        <h5>Join or Create Room by clicking on "+"</h5>
                    </div>
                }
            </div>
            <ToastContainer />
            <ReactTooltip effect="solid" place="bottom" />
        </div>
    )
}
const mapStateToProps = state => {
    return {
        name: state.userDetails.name,
        socket: state.userDetails.socket,
        id: state.userDetails.id,
        joiningRoom: state.userDetails.joiningRoom,
        joiningPath: state.userDetails.joiningPath,
    }
}

const mapDispatchToProps = dispatch => {
    return {

        setSocket: data => {
            dispatch({
                type: 'SET_SOCKET',
                socket: data,
            })
        },
        setName: data => {
            dispatch({
                type: 'SET_NAME',
                name: data,
            })
        },
        setUserId: data => {
            dispatch({
                type: 'SET_USER_ID',
                id: data,
            })
        },
        setAuth: data => {
            dispatch({
                type: 'SET_AUTH',
                auth: data,
            })
        },
        setJoiningRoom: data => {
            dispatch({
                type: 'SET_JOINING_ROOM',
                joiningRoom: data,
            })
        },
        setJoiningPath: data => {
            dispatch({
                type: 'SET_JOINING_Path',
                joiningPath: data,
            })
        }
    }
}



export default connect(mapStateToProps, mapDispatchToProps)(MainComponent)