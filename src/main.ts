import './style.css'
import p5 from 'p5'

const INNER_RADIUS = 25
const TIME_LIMIT = 60000
const BREATH_RHYTHM = 10000 //ms

// Ranked list of delta values
const SCORE_VALUES = [
  {
    text: "PERFECT!",
    threshold: 0.001,
    points: 1000,
  },
  {
    text: "Incredible!",
    threshold: 0.002,
    points: 800,
  },
  {
    text: "Amazing!",
    threshold: 0.004,
    points: 550,
  },
  {
    text: "Great!",
    threshold: 0.008,
    points: 450,
  },
  {
    text: "Good",
    threshold: 0.016,
    points: 300,
  },
  {
    text: "Poor :(",
    threshold: 1,
    points: 0,
  },
] as const

let comboScore = 0;
let totalScore = 0;

const colours = {
  lightblue: [222, 246, 249],
  peach: [232, 166, 143],
  red: [192, 116, 103],

  white: [255, 255, 255],
  black: [10, 10, 17],
}

const palette = {

  background: colours.lightblue,
  breathIn: colours.peach,
  breathOut: colours.red,

  timeline: colours.black,
  timelineDot: colours.peach,

  comboBarStroke: colours.black,
  comboBarFill: colours.red,

  scoreText: colours.black,

} as const

new p5(p => {

  let breathValue = 0;

  p.setup = () => {

    p.createCanvas(innerWidth, innerHeight)
    p.background(palette.background)
    p.noStroke()
    p.textAlign(p.CENTER)

  }

  function isInReleaseBreathPhase() { return breathValue > 0.75 }
  function isInTakeBreathPhase() { return breathValue < 0.25 }

  p.draw = () => {

    const ms = p.millis()

    p.background(palette.background)

    const breathTimer = ((p.TAU * ms) / BREATH_RHYTHM)
    breathValue = 0.50 + 0.5 * p.sin(breathTimer)
    const breathDirection = (((ms + BREATH_RHYTHM / 4) % BREATH_RHYTHM) < (BREATH_RHYTHM / 2)) ? "in" : "out"

    drawBreathingCircle(p, p.width * 0.5, p.height * 0.369, breathValue, (breathDirection === "in") ? palette.breathIn : palette.breathOut)

    processScoreTexts()
    drawScoreTexts(p)

    drawProgressBar(p)
    drawComboBar(p)

    // Reset the flag for the OPPOSITE phase
    if (hasAttemptedTakeBreath && isInReleaseBreathPhase()) { hasAttemptedTakeBreath = false }
    if (hasAttemptedReleaseBreath && isInTakeBreathPhase()) { hasAttemptedReleaseBreath = false }

  }

  // Only allow one attempt per breath
  let hasAttemptedTakeBreath = false
  let hasAttemptedReleaseBreath = false

  p.mousePressed = () => {

    if (hasAttemptedTakeBreath || isInTakeBreathPhase() === false) { return }
    hasAttemptedTakeBreath = true

    // Measure how close we are to the "breath in" point`(one)
    const delta = breathValue

    submitScore(p, delta)

  }

  p.mouseReleased = () => {

    if (hasAttemptedReleaseBreath || isInReleaseBreathPhase() === false) { return }
    hasAttemptedReleaseBreath = true

    // Measure how close we are to the "breath out" point`(zero)
    const delta = p.abs(1 - breathValue)

    submitScore(p, delta)

  }

})

function drawProgressBar(p: p5) {

  p.strokeWeight(2)
  p.stroke(palette.timeline)
  p.line(100, p.height - 100, p.width - 100, p.height - 100)
  p.noStroke()
  p.fill(palette.timelineDot)

  p.circle(p.map(p.millis(), 0, TIME_LIMIT, 100, p.width - 100, true), p.height - 100, 12)

}

let comboBarHeight = 0
function drawComboBar(p: p5) {

  const x = p.width - 125
  const y = p.height * 0.33
  const w = 50
  const h = p.height * 0.33

  const maxPossibleScore = 2 * (TIME_LIMIT / BREATH_RHYTHM) * SCORE_VALUES[0].points
  const targetHeight = p.map(comboScore, 0, maxPossibleScore, 0, -h)
  comboBarHeight = p.lerp(comboBarHeight, targetHeight, 0.05)

  p.stroke(palette.comboBarFill)
  p.noStroke()
  p.rect(x, y + h, w, comboBarHeight)

  p.noFill()
  p.strokeWeight(2)
  p.stroke(palette.comboBarStroke)
  p.rect(x, y, w, h)

}


function drawBreathingCircle(p: p5, x: number, y: number, breathValue: number, colour: number[]) {

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

type ScoreText = {
  string: string,
  position: p5.Vector,
  velocity: p5.Vector,
}
const scoreTexts: ScoreText[] = []

function submitScore(p: p5, delta: number) {

  let score: (typeof SCORE_VALUES)[number] = SCORE_VALUES[SCORE_VALUES.length - 1]

  for (const score_value of SCORE_VALUES) {
    if (delta < score_value.threshold) { score = score_value; break }
  }

  if (score.points === 0) {
    comboScore = 0
  } else {
    comboScore += score.points
  }

  totalScore += score.points

  scoreTexts.push({
    string: score.text,
    position: p.createVector(p.width * 0.5, p.height * 0.369),
    velocity: p.createVector(p.random(-2, 2), p.random(-10, -20))
  })

}

function processScoreTexts() {

  for (let i = scoreTexts.length - 1; i >= 0; i--) {

    const scoreText = scoreTexts[i]
    scoreText.position.add(scoreText.velocity)
    scoreText.velocity.mult(0.9)

    if (scoreText.velocity.magSq() < 0.11) {
      scoreTexts.splice(i)
    }
  }

}

function drawScoreTexts(p: p5) {

  p.noStroke()
  p.fill(palette.scoreText)
  p.textSize(32)
  p.textStyle(p.BOLDITALIC)

  for (const { string, position } of scoreTexts) {
    p.text(string, position.x, position.y)
  }

}