import {combineReducers} from 'redux'

var initState = {
    name: 'Anonymous',
    email: '',
    mic:false,
    camera:false,
    stream:null,
    videoDevices:[],
    audioDevices:[]
}

const userDetailsReducer = (state = initState, action) => {
    if (action.type === 'SET_NAME') {
        return {
            ...state,
            name: action.name
        }
    }
    if (action.type === 'SET_EMAIL') {
        return {
            ...state,
            email: action.email
        }
    }
    if (action.type === 'SET_MIC') {
        return {
            ...state,
            mic: action.mic
        }
    }
    if (action.type === 'SET_CAMERA') {
        return {
            ...state,
            camera: action.camera
        }
    }
    if (action.type === 'SET_STREAM') {
        return {
            ...state,
            stream: action.stream
        }
    }
    if (action.type === 'SET_VIDEO_DEVICES') {
        return {
            ...state,
            videoDevices: action.videoDevices
        }
    }
    if (action.type === 'SET_AUDIO_DEVICES') {
        return {
            ...state,
            audioDevices: action.audioDevices
        }
    }
    return state
}

const Reducer = combineReducers({
    userDetails:userDetailsReducer
})

export default Reducer;