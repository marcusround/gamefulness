import './style.css'
import p5 from 'p5'

const INNER_RADIUS = 25
const BREATH_RHYTHM = 10000 //ms

// Ranked list of delta values
const SCORE_VALUES = {
  perfect: 0.001,
  incredible: 0.002,
  amazing: 0.004,
  great: 0.008,
  good: 0.016,
  poor: 1
} as const

const scoreTimeline = []

const colours: Record<string, [number, number, number]> = {
  lightblue: [222, 246, 249],
  peach: [232, 166, 143],
  red: [192, 116, 103],
}

const palette: Record<string, [number, number, number]> = {

  background: colours.lightblue,
  breathIn: colours.peach,
  breathOut: colours.red,

}

new p5(p => {

  let breathValue = 0;

  p.setup = () => {

    p.createCanvas(innerWidth, innerHeight)
    p.background(palette.background)
    p.noStroke()

  }

  p.draw = () => {

    const ms = p.millis()

    p.background(palette.background)

    const breathTimer = ((p.TAU * ms) / BREATH_RHYTHM)
    breathValue = 0.50 + 0.5 * p.sin(breathTimer)
    const breathDirection = (((ms + BREATH_RHYTHM / 4) % BREATH_RHYTHM) < (BREATH_RHYTHM / 2)) ? "in" : "out"

    drawBreathingCircle(p, p.width / 2, p.height * 0.333, breathValue, (breathDirection === "in") ? palette.breathIn : palette.breathOut)

  }

  p.mousePressed = () => {
    // Measure how close we are to the "breath in" point`(one)
    const delta = p.abs(1 - breathValue)

    const tier = scoreDelta(delta)

    console.log(tier)
  }

  p.mouseReleased = () => {
    // Measure how close we are to the "breath out" point`(zero)
    const delta = breathValue

    const tier = scoreDelta(delta)

    console.log(tier)
  }

})


function drawBreathingCircle(p: p5, x: number, y: number, breathValue: number, colour: [number, number, number]) {

  p.push()

  p.noStroke()
  p.fill(colour)

  p.ellipse(x, y, INNER_RADIUS + 150 * breathValue)

  p.stroke(palette.background)
  p.strokeWeight(2)
  p.noFill()
  p.ellipse(x, y, INNER_RADIUS)

  p.pop()

}


function scoreDelta(delta: number): keyof typeof SCORE_VALUES {

  for (const [rank, cutoff] of Object.entries(SCORE_VALUES)) {
    if (delta < cutoff) { return rank as keyof typeof SCORE_VALUES }
  }

  return "poor"

}

// function