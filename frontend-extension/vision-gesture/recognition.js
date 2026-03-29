// vision-gesture/recognition.js
// for gesture commands 
// thumbs up (like), open palm (readAloud), peacesign (next)
// 8=index tip, 6=indexknuckle, 12=middletip


import {emitCommand } from './events.js'

let lastFiredAt = 0 
const DEBOUNCE_MS = 800 // user needs to hold gesture for 0.8s to fire

//takes in raw MediaPipe landmark data every frame
export function onGestureDetected(results){
    if(!results.multiHandLandmarks?.length) return 

    const lm = results.multiHandLandmarks[0] //takes landmark input
    const gesture = classify(lm) //classifies into gesture
    if (!gesture) return //if not a gesture return

    const now = Date.now()
    if (now - lastFiredAt < DEBOUNCE_MS) return 
    lastFiredAt = now

    emitCommand(gesture) //emit 

}

export function getCurrentGesture(results){
    if(!results.multiHandLandmarks?.length) return null
    return classify(results.multiHandLandmarks[0])
}

function fingerExtended(lm, tip, pip){
        return lm[tip].y < lm[pip].y //tip higher than screen than knuckle
    }

    function classify(lm){
        if (isThumbsUp(lm)) return 'thumbsUp'   // like post or submit draft
        if (isOpenPalm(lm)) return 'openPalm'   // read post aloud
        if (isPeaceSign(lm)) return 'peace'      // open compose window
        if (isSix(lm)) return 'shaka'            // next post

        return null
    }

    function isThumbsUp(lm){
        const thumbsUp = lm[4].y <lm[3].y && lm[4].y < lm[0].y
        const othersCurled = !fingerExtended(lm, 8, 6) && !fingerExtended(lm, 12, 10) && !fingerExtended(lm, 16, 14) && !fingerExtended(lm, 20, 18)
        return thumbsUp && othersCurled
    }

    function isOpenPalm(lm){
        return fingerExtended(lm, 8, 6) && fingerExtended(lm, 12, 10) && fingerExtended(lm, 16, 14) && fingerExtended(lm, 20, 18)
    }

    function isPeaceSign(lm) {
        return fingerExtended(lm, 8, 6) && fingerExtended(lm, 12, 10) && !fingerExtended(lm, 16, 14) && !fingerExtended(lm, 20, 18)
    }

    function isSix(lm) {
        const thumbOut = lm[4].y < lm[2].y
        const pinkyOut = fingerExtended(lm, 20, 18)
        const middleCurled = !fingerExtended(lm, 8, 6) && !fingerExtended(lm, 12, 10) && !fingerExtended(lm, 16, 14)
        return thumbOut && pinkyOut && middleCurled
    }