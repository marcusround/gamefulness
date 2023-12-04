import './style.css'
import p5 from 'p5'

const INNER_RADIUS = 25
const OUTER_RADIUS = 150 // this is added to inner radius
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
    threshold: 0.022,
    points: 300,
  },
  {
    text: "Poor :(",
    threshold: 1,
    points: 0,
  },
] as const

let combo: number[] = [];
let totalScore = 0;

const colours = {
  lightblue: [222, 246, 249],
  peach: [232, 166, 143],
  red: [192, 116, 103],

  white: [255, 255, 255],
  black: [100, 100, 167],

  green: [176, 225, 199],
  blue: [176, 199, 225]

}

const palette = {

  background: colours.lightblue,
  breathCircleA: colours.green,
  breathCircleB: colours.blue,

  timeline: colours.black,
  timelineDot: colours.green,

  outerCircle: colours.black,

  comboBarStroke: colours.black,
  comboBarFill: colours.green,

  scoreText: colours.black,

}


let gameStarted = false
let gameEnded = false
let gameStartedMS = 0

new p5(p => {

  let breathValue = 0;

  p.setup = () => {

    p.createCanvas(innerHeight * 9 / 16, innerHeight)
    p.background(palette.background)
    p.noStroke()
    p.textAlign(p.CENTER)

  }

  function isInReleaseBreathPhase() { return breathValue > 0.75 }
  function isInTakeBreathPhase() { return breathValue < 0.25 }

  p.draw = () => {

    p.background(palette.background)

    // if (gameStarted === false) { drawStartGameScreen(p); return }
    if (gameEnded) { drawEndGameScreen(p); return }

    const ms = p.millis() - gameStartedMS
    if (ms > TIME_LIMIT) { drawEndGameScreen(p); return }

    doScreenShake(p)

    // drawHelpText(p)

    const breathTimer = gameStarted === false ? 0 : ((p.TAU * ms) / BREATH_RHYTHM)
    breathValue = 1 - (0.50 + 0.5 * p.cos(breathTimer))
    const breathDirection = (((ms + BREATH_RHYTHM / 4) % BREATH_RHYTHM) < (BREATH_RHYTHM / 2)) ? "in" : "out"

    drawBreathingCircle(p, p.width * 0.5, p.height * 0.5, breathValue)

    processScoreTexts()
    drawScoreTexts(p)

    drawProgressBar(p)
    drawComboBar(p)

    // Reset the flag for the OPPOSITE phase
    if (hasAttemptedTakeBreath && isInReleaseBreathPhase()) { hasAttemptedTakeBreath = false }
    if (hasAttemptedReleaseBreath && isInTakeBreathPhase()) { hasAttemptedReleaseBreath = false }

  }

  // Only allow one attempt per breath
  // Starting with these set to true is a hacky way to stop first click counting as a breath
  let hasAttemptedTakeBreath = true
  let hasAttemptedReleaseBreath = true

  p.mousePressed = () => {

    if (gameStarted === false) {
      gameStarted = true
      gameStartedMS = p.millis()
    }

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

function drawHelpText(p: p5) {

  p.fill(palette.scoreText)
  p.noStroke()
  p.textAlign(p.CENTER)
  p.textStyle(p.ITALIC)
  p.textSize(12)
  p.text("Press & hold mouse to take in breath.\nRelease mouse to release breath.", p.width * 0.5, 60)

}

function drawEndGameScreen(p: p5) {

  p.background(palette.background)
  p.fill(palette.scoreText)
  p.noStroke()
  p.textSize(32)
  p.textStyle(p.NORMAL)
  p.textAlign(p.CENTER)
  p.text(`Final Score: ${totalScore}`, p.width * 0.5, p.height * 0.5)

}

let screenShake = 0
let screenShakeSustain = 0.95
function doScreenShake(p: p5) {

  p.translate(p.random(-screenShake, screenShake), p.random(-screenShake, screenShake))

  if (screenShake > 0.5) {
    screenShake = p.max(screenShake * (screenShakeSustain + p.pow(1 - screenShakeSustain, 1.4)), 0)
  } else {
    screenShake = 0
  }

}

function drawProgressBar(p: p5) {

  p.strokeWeight(2)
  p.stroke(palette.timeline)
  p.line(100, p.height - 100, p.width - 100, p.height - 100)
  // p.noStroke()
  p.strokeWeight(1)
  p.fill(palette.timelineDot)

  const progress = gameStarted ? p.millis() - gameStartedMS : 0

  p.circle(p.map(progress, 0, TIME_LIMIT, 100, p.width - 100, true), p.height - 100, 12)

}

let comboBarFullness = 0
function drawComboBar(p: p5) {

  const x = 100
  const y = 100
  const w = p.width - 200
  const h = 25

  const maxPossibleScore = 2 * (TIME_LIMIT / BREATH_RHYTHM) * SCORE_VALUES[0].points
  const targetFullness = p.map(combo.reduce((p, c) => (p + c), 0), 0, maxPossibleScore, 0, w)
  comboBarFullness = p.lerp(comboBarFullness, targetFullness, 0.05)

  p.fill(shakeColour(p, palette.comboBarFill))
  p.noStroke()
  p.rect(x, y, comboBarFullness, h)

  p.noFill()
  p.strokeWeight(1)
  p.stroke(palette.comboBarStroke)
  p.rect(x, y, w, h)

}

function shakeColour(p: p5, color: number[]) {
  return p.lerpColor(p.color(color), p.color(getRandomBrightColour()), screenShake / 50)
}


function drawBreathingCircle(p: p5, x: number, y: number, breathValue: number) {

  let { breathCircleA, breathCircleB } = palette

  p.push()

  p.fill(breathCircleA)
  p.noStroke()
  p.ellipse(x, y, INNER_RADIUS)

  p.noFill()
  p.strokeWeight(1)
  p.stroke(breathCircleA)


  const innerColour = shakeColour(p, breathCircleA)
  const outercolour = shakeColour(p, breathCircleB)

  // p.ellipse(x, y, INNER_RADIUS + OUTER_RADIUS * breathValue)
  const targetRadius = INNER_RADIUS + OUTER_RADIUS * breathValue
  for (let r = INNER_RADIUS; r < targetRadius; r++) {
    p.stroke(p.lerpColor(innerColour, outercolour, (r - INNER_RADIUS) / (targetRadius - INNER_RADIUS)))
    p.ellipse(x, y, r)
  }

  p.stroke(palette.outerCircle)
  p.noFill()
  p.ellipse(x, y, INNER_RADIUS + OUTER_RADIUS)

  p.stroke(palette.outerCircle)
  p.fill(palette.background)
  p.strokeWeight(1)
  p.ellipse(x, y, INNER_RADIUS)

  p.pop()

}

type ScoreText = {
  string: string,
  position: p5.Vector,
  velocity: p5.Vector,
  color?: number[] | "random",
  comboLength?: number,
}
const scoreTexts: ScoreText[] = []

function submitScore(p: p5, delta: number) {

  let score: (typeof SCORE_VALUES)[number] = SCORE_VALUES[SCORE_VALUES.length - 1]

  for (const score_value of SCORE_VALUES) {
    if (delta < score_value.threshold) { score = score_value; break }
  }

  if (score.points === 0) {
    combo = []
  } else {
    combo.push(score.points)
  }

  totalScore += Math.floor((score.points) * p.pow(combo.length, 1.4))

  scoreTexts.push({
    string: score.text,
    position: p.createVector(p.width * 0.5, p.height * 0.5),
    velocity: p.createVector(p.random(-2, 2), p.random(-10, -20)),
    color: score == SCORE_VALUES[0] ? "random" : (score == SCORE_VALUES[1] || score == SCORE_VALUES[2]) ? getRandomBrightColour() : undefined,
  })

  screenShake += combo.length

  if (
    combo.length === 3
    || combo.length > 4
  ) {
    setTimeout(() => {

      scoreTexts.push({
        string: `${combo.length}x Combo!!`,
        position: p.createVector(p.width * 0.5, 100),
        velocity: p.createVector(p.random(2, 12), p.random(15, 26)),
        color: combo.length > 4 ? getRandomBrightColour() : undefined,
        comboLength: combo.length
      })

      screenShake += p.pow(combo.length, 2)

    }, 400)

  }

}

function getRandomBrightColour(variance = 200) {

  let pigment = variance * 3
  const colour = [255 - variance, 255 - variance, 255 - variance]
  for (let i = 0; i < 3; i++) {
    const p = (i === 3) ? pigment : Math.floor(pigment * Math.random())
    pigment -= p
    colour[i] += p
  }
  return colour.sort(() => Math.random())

}


function processScoreTexts() {

  for (let i = scoreTexts.length - 1; i >= 0; i--) {

    const scoreText = scoreTexts[i]
    scoreText.position.add(scoreText.velocity)
    scoreText.velocity.mult(0.9)

    if (scoreText.velocity.magSq() < 0.11) {
      scoreTexts.splice(i, 1)
    }
  }

}

function drawScoreTexts(p: p5) {

  p.noStroke()
  p.stroke(palette.scoreText)
  p.textSize(32)
  p.textStyle(p.BOLDITALIC)

  for (const { string, position, color, comboLength } of scoreTexts) {
    p.fill(color === "random" ? getRandomBrightColour() : color ?? palette.scoreText)
    if (comboLength) {
      p.strokeWeight(2)
      if (comboLength > 6) {
        p.fill(getRandomBrightColour())
      }
    }
    p.text(string, position.x, position.y)
  }

}