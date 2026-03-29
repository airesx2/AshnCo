// vision-gesture/fingerspell.js
// index fingertip traces in the air, recognized
// use $1 Unistroke recognizer to classify stroke into letter

import {emitCommand} from './events.js'
import { DollarRecognizer} from './dollar.js'

let isDrawing = false
let stroke = [] //array{x,y} points collection during drawing
let pauseTimer = null //user pauses are detected (end of each letter)

const PAUSE_MS = 1000 //1s no movement = letter is done 
const recognizer = new DollarRecognizer()

//call every frame with full MediaPipe results
export function updateFingerspell(results){
    if (!results.multiHandLandmarks?.length) {
        stopDrawing()
        return 
    }


    const lm = results.multiHandLandmarks[0]
    const tip = lm[8] //this is the index fingertip

    //confirms index finger extended to draw, ignore otherwise
    const drawing = lm[8].y < lm[6].y
    if(!drawing){
        stopDrawing()
        return
    }

    //collect point(normalized 0-1), scale to canvas size)
    isDrawing = true
    stroke.push({x: tip.x *window.innerWidth, y: tip.y * window.innerHeight}) //push point to array

    //reset pause timer every frame we get point
    clearTimeout(pauseTimer)
    pauseTimer = setTimeout(() => commitLetter(), PAUSE_MS)

}

//call when usder pause -> treat accumulated stroke as 1 letter
function commitLetter(){
    if (stroke.length < 10) { //detects accident, too few points
        stroke = [] //reset
        return
    }
    const result = recognizeStroke(stroke) //feed into recognizer 
    stroke = [] //reset 

    if(result){
    emitCommand('letter:' + result )  
}
}


function stopDrawing() {
    isDrawing = false
}

// uses $1 to recognize shapes
function recognizeStroke(points){
    const result = recognizer.Recognize(points, false)
    console.log('recognized: ', result.Name, 'score: ', result.Score)
    if (result.Score > 0.6) { //confidence threshold
        return result.Name //return letter 
    }
    return null
}