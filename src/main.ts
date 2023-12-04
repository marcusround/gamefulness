import p5 from 'p5'


new p5(p => {

  p.setup = () => {

    p.createCanvas(innerHeight * 9 / 16, innerHeight)
    p.background('grey')

  }

  p.draw = () => {

    p.background('grey')
    p.ellipse(100, 100, 100, 100)

  }
}
)